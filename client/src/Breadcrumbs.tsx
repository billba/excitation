import { Link } from "react-router";

interface Props {
  breadcrumbs: [title: string, href?: string][];
}

export const Breadcrumbs = ({ breadcrumbs }: Props) => {
  return (
    <div id="breadcrumbs">
      {breadcrumbs.map(([title, href], i) => (<span key={title}>
        {href ? (
          <Link to={href}>{title}</Link>
        ) : title}
        {i < breadcrumbs.length - 1 ? <>&nbsp;&gt;&nbsp;</> : <></>}
        </span>
      ))}
    </div>
  );
}