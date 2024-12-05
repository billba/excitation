import { Breadcrumbs } from "./Breadcrumbs";

export const Home = () => {
  return (
    <div>
      <Breadcrumbs breadcrumbs={[["Home"]]} />
      <p>
        In the future this is where a user will authenticate and see a list of
        forms to review.
      </p>
    </div>
  );
};
