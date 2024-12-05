import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { FormQuestion } from "./App.tsx";
import "./App.css";
import { Form } from "./Form.tsx";
import { Home } from "./Home.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" >
          <Route index element={<Home />} />
          <Route path=":formId" element={<Form />} />
          <Route path=":formId/:questionId" element={<FormQuestion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
