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
    <FormView formId={formId!} />
  );
};

interface Props {
  formId: string;
}

const FormView = ({ formId }: Props) => {
  const [state] = useAppState();

  const {
    questions,
    metadata: { templateName, formName },
  } = state as LoadedState;

  return (
    <div>
      <Breadcrumbs breadcrumbs={[["Home", "/"], ["Form"]]} />
      <div id="form">
        <h3>
          {templateName}: {formName}
        </h3>
        <dl>
          {questions.map(({ prefix, text, answer }, questionIndex) => (
            <Link to={`/${formId}/${questionIndex}`} key={questionIndex}>
              <div className="form-question">
                <div>
                  {prefix}.{text}
                </div>
                <div className="form-answer">{answer ?? <>&nbsp;</>}</div>
              </div>
            </Link>
          ))}
        </dl>
      </div>
    </div>
  );
};
