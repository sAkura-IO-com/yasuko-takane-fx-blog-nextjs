import { fxCopy } from "@/lib/fx/copy";
import { currentFxYear } from "@/lib/fx/year";
import { siteName } from "@/lib/seo/copy";

import { FxThemeToggle } from "./fx-theme-toggle";

export async function FxFooter() {
  const year = await currentFxYear();

  return (
    <footer className="fx-footer">
      <div className="fx-footer-inner">
        <p className="fx-footer-copy">
          {fxCopy.copyright(year, siteName)} {fxCopy.poweredBy}{" "}
          <a href="https://github.com/sAkura-io-com">sAkura-IO</a>
        </p>
        <FxThemeToggle />
      </div>
    </footer>
  );
}
