import { type Form, type Template } from "./excitation.ts";
import { clientUrl } from "./server.ts";
import { type Settings } from "./settings.ts";

const valueAndSelected = (test: Settings["test"], value: Settings["test"]) => `value="${test}" ${test === value ? "checked" : ""}`;

export function dashboard(forms: Form[], templates: Template[], { test, randomness, count, tries }: Settings): string {
  console.log(test, randomness, count, tries);
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Excitation Dashboard</title>
      </head>
      <body>
        <h2><i>excitation</i> dashboard</h3>
          <form action="/settings" method="post">
            <h3>testing</h3>
            <p style="font-size: smaller">(submit changes before reviewing citations)</p>
            <div>
              <input type="radio" name="test" ${valueAndSelected("none", test)}>No errors</input>
            </div>
            <div>
              <input type="radio" name="test" ${valueAndSelected("random", test)}>Random errors</input>
              &nbsp;
              <input type="text" size="3" name="randomness" value="${randomness}"/>%
            </div>
            <div>
              <input type="radio" name="test" ${valueAndSelected("scheduled", test)}>Scheduled error</input>
              &nbsp;
              <input type="text" size="3" name="count" value="${count}"/>
              &nbsp;time(s) after&nbsp;
              <input type="text" size="3" name="tries" value="${tries}"/>
              &nbsp;tries&nbsp;
            </div>
            <button type="submit">Submit</button>
          </form>
        ${templates.map(
          (template, templateId) => `
          <h3>template "${template.name}"</h4>
          ${template.formBootstraps
            .map(
              (bootstrap, bootstrapId) => `
            <h4>
              ${bootstrap.name}
            </h4>
            <ul>
            <div>
              <a href="/newform/${templateId}/${bootstrapId}">new form</a>
            </div>
            <br>
            ${forms
              .map((form, formId) => [form, formId] as const)
              .filter(
                ([form]) =>
                  form.templateId === templateId && form.name === bootstrap.name
              )
              .map(
                ([_, formId]) => `
                <li>
                  <a href="${clientUrl(formId)}">Form #${formId}</a>
                </li>
              `
              )
              .join("")}
            </ul>
          `
            )
            .join("")}
        `
        )}
      </body>
    </html>
  `;
}
