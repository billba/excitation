import { FluentIcon } from "@fluentui/react-icons";

interface Props {
  DefaultIcon: FluentIcon;
  HoverIcon: FluentIcon;
  MaskIcon?: FluentIcon;
  classes: string;
  onClick: ((event: React.MouseEvent) => void) | undefined;
}

export const HoverableIcon = ({
  DefaultIcon,
  HoverIcon,
  MaskIcon,
  classes,
  onClick,
}: Props) => (
  <div
    className={`icon-container hoverable ${classes}`}
    onClick={onClick}
  >
    {MaskIcon && <MaskIcon className="icon floating background" />}
    <DefaultIcon className={`icon default ${MaskIcon ? "floating" : ""}`} />
    <HoverIcon className={`icon hover ${MaskIcon ? "floating" : ""}`} />
  </div>
);
