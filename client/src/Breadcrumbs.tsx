import { Link } from "react-router";

interface Props {
  breadcrumbs: [title: string, href: string][];
}

export const Breadcrumbs = ({ breadcrumbs }: Props) => {
  return (
    <div id="breadcrumbs">
      {breadcrumbs.map(([title, href]) => (<>
        {href ? (
          <Link to={href} key={title}>{title}</Link>
        ) : title}
        &nbsp;&gt;&nbsp;
        </>
      ))}
    </div>
  );
}