import { Link } from "react-router";

interface Props {
  breadcrumbs: [title: string, href?: string][];
}

export const Breadcrumbs = ({ breadcrumbs }: Props) => {
  return (
    <div id="breadcrumbs">
      {breadcrumbs.map(([title, href], i) => (<>
        {href ? (
          <Link to={href} key={title}>{title}</Link>
        ) : title}
        {i < breadcrumbs.length - 1 ? <>&nbsp;&gt;&nbsp;</> : <></>}
        </>
      ))}
    </div>
  );
}