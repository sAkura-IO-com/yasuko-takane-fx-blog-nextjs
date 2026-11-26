"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Fingerprint, Lock, Mail } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";

import { authClient } from "@/lib/better-auth/auth-client";
import { isPasskeyCancelled } from "@/lib/better-auth/passkey";
import { authRedirectError } from "@/lib/better-auth/zh-errors";
import { Button, StatefulButton } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { EASE_OUT } from "@/lib/ease";

type Status = "idle" | "loading" | "success" | "error";

const AUTH_CARD_CLASS =
  "flex w-full max-w-sm flex-col rounded-3xl border border-border p-6";

const RATE_LIMIT_MESSAGE = "Too many requests. Please try again later.";

function formAuthError(message: string | undefined, fallback: string) {
  if (message === RATE_LIMIT_MESSAGE) return "操作过于频繁，请稍后再试";
  return message || fallback;
}

export function LoginForm({
  callbackUrl,
  error,
}: {
  callbackUrl: string;
  error?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [passkeyStatus, setPasskeyStatus] = useState<Status>("idle");
  const [githubStatus, setGithubStatus] = useState<Status>("idle");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    error ? authRedirectError(error) : undefined,
  );

  const isBusy =
    status === "loading" ||
    passkeyStatus === "loading" ||
    githubStatus === "loading";

  function finishLogin() {
    setStatus("success");
    toast.success("登录成功");
    router.replace(callbackUrl);
    router.refresh();
  }

  useEffect(() => {
    if (
      typeof PublicKeyCredential === "undefined" ||
      !PublicKeyCredential.isConditionalMediationAvailable
    ) {
      return;
    }

    let cancelled = false;

    void PublicKeyCredential.isConditionalMediationAvailable().then(
      (available) => {
        if (!available || cancelled) return;
        void authClient.signIn.passkey({ autoFill: true }).then((result) => {
          if (cancelled || result.error || !result.data) return;
          finishLogin();
        });
      },
    );

    return () => {
      cancelled = true;
    };
    // 条件式 UI 只在挂载时触发一次浏览器提示
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only WebAuthn autofill
  }, []);

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError(undefined);
    setPasswordError(undefined);
    setErrorMessage(undefined);

    if (!email.trim()) {
      setEmailError("请输入邮箱。");
      return;
    }
    if (!password) {
      setPasswordError("请输入密码。");
      return;
    }

    setStatus("loading");
    const { error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: callbackUrl,
    });
    if (signInError) {
      setStatus("error");
      setErrorMessage(formAuthError(signInError.message, "登录失败"));
      return;
    }
    finishLogin();
  }

  async function handlePasskeySignIn() {
    setPasskeyStatus("loading");
    setErrorMessage(undefined);
    const { data, error: passkeyError } = await authClient.signIn.passkey();
    if (passkeyError) {
      if (isPasskeyCancelled(passkeyError)) {
        setPasskeyStatus("idle");
        return;
      }
      setPasskeyStatus("error");
      setErrorMessage(formAuthError(passkeyError.message, "通行密钥登录失败"));
      return;
    }
    if (data) {
      setPasskeyStatus("success");
      finishLogin();
    }
  }

  async function handleGithubSignIn() {
    setGithubStatus("loading");
    const { error: githubError } = await authClient.signIn.social({
      provider: "github",
      callbackURL: callbackUrl,
      errorCallbackURL: "/login",
    });
    if (githubError) {
      setGithubStatus("error");
      setErrorMessage(formAuthError(githubError.message, "GitHub 登录失败"));
    }
  }

  return (
    <div className={AUTH_CARD_CLASS}>
      <AuthHeader
        title="登录"
        description="使用邮箱密码、通行密钥或 GitHub 登录管理后台。"
      />

      <HeightReveal show={Boolean(errorMessage)} id="error">
        {errorMessage ? <FormBanner message={errorMessage} /> : null}
      </HeightReveal>

      <form noValidate onSubmit={handlePasswordSignIn} className="flex flex-col">
        <div className="pt-5">
          <Input
            label="邮箱"
            type="email"
            autoComplete="username webauthn"
            placeholder="请输入邮箱"
            leftIcon={<Mail />}
            disabled={isBusy}
            value={email}
            onChange={(next) => {
              setEmail(next);
              setEmailError(undefined);
              setErrorMessage(undefined);
            }}
            error={emailError}
          />
        </div>

        <div className="pt-5">
          <PasswordField
            label="密码"
            autoComplete="current-password webauthn"
            placeholder="输入密码"
            disabled={isBusy}
            value={password}
            reveal={reveal}
            onToggleReveal={() => setReveal((current) => !current)}
            onChange={(next) => {
              setPassword(next);
              setPasswordError(undefined);
              setErrorMessage(undefined);
            }}
            error={passwordError}
          />
        </div>

        <div className="pt-5">
          <StatefulButton
            type="submit"
            size="lg"
            state={status}
            loadingText="请稍候"
            successText="完成"
            errorText="请重试"
            className="w-full"
          >
            登录
          </StatefulButton>
        </div>
      </form>

      <div className="flex flex-col gap-4 pt-6">
        <AuthDivider />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={isBusy}
          onClick={handlePasskeySignIn}
        >
          {passkeyStatus === "loading" ? (
            <Spinner />
          ) : (
            <Fingerprint className="size-4" />
          )}
          使用通行密钥登录
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={isBusy}
          onClick={handleGithubSignIn}
        >
          {githubStatus === "loading" ? <Spinner /> : <GitHubMark />}
          使用 GitHub 登录
        </Button>
      </div>
    </div>
  );
}

function HeightReveal({
  show,
  id,
  children,
}: {
  show: boolean;
  id: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  if (!show) return null;

  return (
    <motion.div
      key={id}
      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
      transition={reduce ? { duration: 0 } : { duration: 0.22, ease: EASE_OUT }}
      style={{ overflow: "hidden" }}
    >
      <div className="pt-4">{children}</div>
    </motion.div>
  );
}

function AuthHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FormBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
    >
      {message}
    </p>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground">或</span>
      <Separator className="flex-1" />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  onToggleReveal,
  reveal,
  disabled,
  autoComplete,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onToggleReveal: () => void;
  reveal: boolean;
  disabled?: boolean;
  autoComplete: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <Input
      label={label}
      type={reveal ? "text" : "password"}
      autoComplete={autoComplete}
      placeholder={placeholder}
      leftIcon={<Lock />}
      rightIcon={
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleReveal}
          aria-label={reveal ? "隐藏密码" : "显示密码"}
          className="text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
        >
          {reveal ? <EyeOff /> : <Eye />}
        </button>
      }
      disabled={disabled}
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}

function GitHubMark() {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="size-4 fill-current"
    >
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
