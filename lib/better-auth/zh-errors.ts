import { zh } from "@better-auth/i18n/locales";

export const zhAuthErrors: Record<string, string> = {
  ...zh,

  USER_NOT_FOUND: "找不到该账号",
  FAILED_TO_CREATE_USER: "创建账号失败，请稍后重试",
  FAILED_TO_CREATE_SESSION: "登录失败，请稍后重试",
  FAILED_TO_UPDATE_USER: "更新账号失败，请稍后重试",
  FAILED_TO_GET_SESSION: "获取登录状态失败，请稍后重试",
  INVALID_PASSWORD: "密码不正确",
  INVALID_EMAIL: "邮箱格式不正确",
  INVALID_EMAIL_OR_PASSWORD: "邮箱或密码不正确",
  INVALID_USER: "账号无效",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "该第三方账号已绑定到其他用户",
  PROVIDER_NOT_FOUND: "不支持该登录方式",
  INVALID_TOKEN: "链接无效或已过期，请重新获取",
  TOKEN_EXPIRED: "链接已过期，请重新获取",
  ID_TOKEN_NOT_SUPPORTED: "当前登录方式不受支持",
  FAILED_TO_GET_USER_INFO: "获取第三方账号信息失败",
  USER_EMAIL_NOT_FOUND: "该第三方账号未提供邮箱",
  EMAIL_NOT_VERIFIED: "请先验证邮箱",
  PASSWORD_TOO_SHORT: "密码过短，至少需要 8 位",
  PASSWORD_TOO_LONG: "密码过长",
  USER_ALREADY_EXISTS: "该邮箱已被注册",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "该邮箱已被注册，请使用其他邮箱",
  EMAIL_CAN_NOT_BE_UPDATED: "无法修改邮箱",
  CHANGE_EMAIL_DISABLED: "暂不支持修改邮箱",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "该账号尚未设置密码",
  SESSION_EXPIRED: "登录已过期，请重新登录后再试",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "至少需要保留一种登录方式",
  ACCOUNT_NOT_FOUND: "找不到该绑定账号",
  USER_ALREADY_HAS_PASSWORD: "该账号已设置密码",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: "登录请求被拦截，请从本站重新发起",
  VERIFICATION_EMAIL_NOT_ENABLED: "邮箱验证暂不可用",
  EMAIL_ALREADY_VERIFIED: "邮箱已完成验证",
  EMAIL_MISMATCH: "邮箱不匹配",
  SESSION_NOT_FRESH: "登录状态已过期，请重新登录后再试",
  LINKED_ACCOUNT_ALREADY_EXISTS: "该第三方账号已绑定",
  INVALID_ORIGIN: "请求来源不受信任",
  INVALID_CALLBACK_URL: "回调地址无效",
  INVALID_REDIRECT_URL: "跳转地址无效",
  INVALID_ERROR_CALLBACK_URL: "错误回调地址无效",
  INVALID_NEW_USER_CALLBACK_URL: "注册回调地址无效",
  MISSING_OR_NULL_ORIGIN: "缺少请求来源",
  CALLBACK_URL_REQUIRED: "缺少回调地址",
  FAILED_TO_CREATE_VERIFICATION: "验证信息创建失败，请稍后重试",
  FIELD_NOT_ALLOWED: "包含不允许修改的字段",
  ASYNC_VALIDATION_NOT_SUPPORTED: "不支持该校验方式",
  VALIDATION_ERROR: "提交的信息有误，请检查后重试",
  MISSING_FIELD: "请填写必填项",
  METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED: "当前请求方式不受支持",
  BODY_MUST_BE_AN_OBJECT: "请求格式有误",
  PASSWORD_ALREADY_SET: "该账号已设置密码",

  OTP_EXPIRED: "验证码已过期，请重新获取",
  INVALID_OTP: "验证码不正确",
  TOO_MANY_ATTEMPTS: "尝试次数过多，请重新获取验证码",

  BANNED_USER: "你的账号已被封禁，如有疑问请联系站长",
  YOU_CANNOT_BAN_YOURSELF: "不能封禁自己",
  YOU_CANNOT_REMOVE_YOURSELF: "不能删除自己",
  YOU_CANNOT_IMPERSONATE_ADMINS: "不能扮演其他管理员",
  NO_DATA_TO_UPDATE: "没有需要保存的改动",
  INVALID_ROLE_TYPE: "角色格式不正确",
  YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE: "不能设置不存在的角色",
  YOU_ARE_NOT_ALLOWED_TO_CHANGE_USERS_ROLE: "无权修改用户角色",
  YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS: "无权新增用户",
  YOU_ARE_NOT_ALLOWED_TO_LIST_USERS: "无权查看用户列表",
  YOU_ARE_NOT_ALLOWED_TO_LIST_USERS_SESSIONS: "无权查看用户会话",
  YOU_ARE_NOT_ALLOWED_TO_BAN_USERS: "无权封禁用户",
  YOU_ARE_NOT_ALLOWED_TO_IMPERSONATE_USERS: "无权扮演用户",
  YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS: "无权吊销用户会话",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_USERS: "无权删除用户",
  YOU_ARE_NOT_ALLOWED_TO_SET_USERS_PASSWORD: "无权修改用户密码",
  YOU_ARE_NOT_ALLOWED_TO_GET_USER: "无权查看该用户",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_USERS: "无权修改用户资料",
  YOU_ARE_NOT_ALLOWED_TO_SET_USERS_EMAIL: "无权修改用户邮箱",
  PASSWORD_CANNOT_BE_UPDATED_VIA_UPDATE_USER:
    "密码不能通过修改资料更新，请使用「设置密码」",

  EMAIL_PASSWORD_SIGN_UP_DISABLED: "暂未开放注册",

  UNKNOWN_ERROR: "操作失败，请稍后重试",
  SESSION_REQUIRED: "请先登录",
};

const REDIRECT_ERROR_ALIASES: Record<string, string> = {
  signup_disabled: zhAuthErrors.EMAIL_PASSWORD_SIGN_UP_DISABLED,
  new_user_signup_disabled: zhAuthErrors.EMAIL_PASSWORD_SIGN_UP_DISABLED,
  invalid_token: zhAuthErrors.INVALID_TOKEN,
  token_expired: zhAuthErrors.TOKEN_EXPIRED,
  user_not_found: zhAuthErrors.USER_NOT_FOUND,
  failed_to_create_user: zhAuthErrors.FAILED_TO_CREATE_USER,
  failed_to_create_session: zhAuthErrors.FAILED_TO_CREATE_SESSION,
  account_not_linked:
    "该第三方账号对应的邮箱已注册，但尚未绑定。请先用已有方式登录后再绑定。",
  unable_to_link_account: "无法完成账号绑定，请先登录后再试。",
};

export function authRedirectError(
  code: string,
  fallback = "操作失败，请稍后重试",
): string {
  return (
    zhAuthErrors[code] ??
    zhAuthErrors[code.toUpperCase()] ??
    REDIRECT_ERROR_ALIASES[code] ??
    fallback
  );
}

export function authErrorMessage(
  error: unknown,
  fallback = "操作失败，请稍后重试",
): string {
  const code = (error as { body?: { code?: unknown } } | null)?.body?.code;
  if (typeof code === "string") {
    const translated = authRedirectError(code, "");
    if (translated) return translated;
  }
  const message = error instanceof Error ? error.message.trim() : "";
  return message || fallback;
}
