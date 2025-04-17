# Excitation user modes

[Excitation](../README.md)'s user experience can be described as a heirarchy of modes, which correspond to the state machine in the code. Some modes are explicit high level modes, some (like review status) are derived from the values of fields available in those modes. The following explains the modes, and attempts to make clear the various transitions between said modes in terms of the user experience.

The key concepts are:

* a user fills out a *Form*, which is an instance of a *Template*, which is mostly just a list of *Questions*. So for example, an insurance company may have separate applications for individuals and businesses. Each would have its own template.
* a (potentially different) user creates a form (e.g. for an individual insurance application) attaches a set of *Documents* (provided by e.g. the individuals's insurance broker) to said form, and initiates an automated process which generates *Citations* for each question using the documents as inputs.
* the user filling out the form looks at each question, one at a time, and *Reviews* the suggested citations as *Approved* or *Rejected*. They can also *Resize* the citation (adjusting the start and/or end of the excerpt to make it more relevent), *Edit* the excerpt text (in the case of incorrect OCR), or peruse or *Search* the documents for additional relevent excerpts which they may manually add as citations.
* once all citations have been reviewed, the user may *Answer* the question based solely on the approved citations. There may also be a suggested answer provided by the app.
* the current state of the form is always persisted to the backend

As currently implemented, _Excitation_ is invoked with a reference to a specific form, and loads that form from the backend on launch.

## Form mode

url:/:formId

The user sees all the questions in the form, along with any answers that have been entered

The user can:

* peruse the questions, along with any entered answers
* click on a question or a blank answer, which takes them to Form Question Review mode
* click on an entered answer, which takes them to Form Question Answer mode
* submit the form (which may include unanswered questions)

## Form Question modes

url/:formId/:questionId

In all these submodes, the user sees a given question. In general the user can return to Form mode at any time to pick a different question.

### Review mode

The user sees all citations for the given question, and the document viewer, which is either empty or shows one page from a given document.

The various submodes allow the user to view, review, edit, and resize citations, peruse the documents, and create new citations.

#### Idle mode

A user can end up in a state where they are not looking at a current document, for instance if a question has no citations.

Since every citation is associated with a page in a document, it is always true that no citation is selected in this mode.

Also, since there is no document, and thus no current page, no citation can be created.

The user can:
* select a given document to peruse or search
* select a citation (if there are any)

#### Document modes

All these modes involve viewing a current document, and a current page on that document.

##### Document Viewing mode

The user is perusing or searching a given document, but no citation is selected. The user can:

* enter Add Citation mode
* select a citation (if there are any)

##### Citation modes

Whenever a citation is selected in the list we are in one of the citation modes

###### A Citation is being viewed

The user has selected a citation from the citation list. Every citation has a document and a page range. The viewer shows a page from that document from within the indicated range, and highlights in the viewer the part of the citation present on that page.

From here a user could choose to edit the text of the current citation, resize its bounds, select a different citation, or enter Add Citation mode.

Mousing over the highlighted citation reveals resize handles at the start and end of the citation. If a multi-page citation, the start handle is only available on the first page, and the end handle on the last.

If the citation has already been accepted or rejected, the current review status is shown. The user can "unreview" the citation.

If the citation is unreviewed, the user can accept or reject the citation

###### Resize citation modes

The user starts the resizing process by dragging one of the resize handles. If they return it to its original place, the app returns to the citation viewing mode.

If the user releases the handle in a new location, the app enters resize mode. The original bounds are displayed along with the newly resized bounds.

The user may continue to resize the citation by moving one or the other resize handle in this way until they either:

* return them both back to their original locations, in which the app returns to the citation viewing mode.
* confirm the newly resized handle, which changes the citation bounds (and excerpt) and returns the user to citation viewing mode with the newly resized citation selected
* cancel the resize, which returns the user to citation viewing mode with citation reverted to its original size.

### Answer mode

Once all citations for a given question have been reviewed, the user can answer the question.

Only approved citations for that question are shown, and the document viewer is either hidden or made so small that the user can't "cheat" by referring to unapproved excerpts.

The user can:

* answer the question
* edit an answered question
* return to Review mode

When a question is newly answered, or is being edited, the app is in a modal state. The user must confirm or cancel their answer/change before they can leave Answer mode.
