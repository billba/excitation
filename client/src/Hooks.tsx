import { useMemo } from "react";
import { FluentIcon } from "@fluentui/react-icons";

export const useHoverableIcon = (
  DefaultIcon: FluentIcon,
  HoverIcon: FluentIcon,
  key: string,
  classes: string,
  onClick?: (event: React.MouseEvent) => void
) =>
  useMemo(
    () => () => (
      <div
        key={key}
        className={`icon-container hoverable ${classes}`}
        onClick={onClick}
      >
        <DefaultIcon className="icon default" />
        <HoverIcon className="icon hover" />
      </div>
    ),
    [DefaultIcon, HoverIcon, key, classes, onClick]
  );
