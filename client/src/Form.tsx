import { useParams, Link } from "react-router";
import { useAppState, useAppStateValue, useLoadForm } from "./State";
import { FormStatus, LoadedState } from "./Types";
import { Breadcrumbs } from "./Breadcrumbs";

export const Form = () => {
  const { formId } = useParams();
  useLoadForm(Number(formId));
  const { formStatus } = useAppStateValue();

  return formStatus == FormStatus.None ? (
    <div>NO FORM</div>
  ) : formStatus == FormStatus.Error ? (
    <div>ERROR</div>
  ) : formStatus == FormStatus.Loading ? (
    <div>LOADING</div>
  ) : (
    <FormView />
  );
};

const FormView = () => {
  const [state] = useAppState();

  const {
    questions,
    metadata: { templateName, formName },
  } = state as LoadedState;

  return (
    <div>
      <Breadcrumbs breadcrumbs={[["Home", "/"]]} />
      <h3>
        {templateName}: {formName}
      </h3>
      <dl>

        {questions.map(({ prefix, text, answer }, questionIndex) => (
          <p key={questionIndex} className="form-question">
            <dt>
              {prefix}.{text}
            </dt>
            <Link to={`${questionIndex}`}>Edit</Link>
            <dd>{answer}</dd>
          </p>
        ))}
      </dl>
    </div>
  );
};
