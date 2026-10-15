---
template: prose
strand: info
title: 'Contact'
description: 'Reach out to the team at contact@odysseaninstitute.org'
heading: 'Contact us'
form:
  fields:
    - { name: name, label: 'Name', type: text, required: true }
    - { name: email, label: 'Email', type: email, required: true }
    - { name: phone, label: 'Phone', type: tel }
    - { name: subject, label: 'Subject', type: text }
    - { name: message, label: 'Message', type: textarea, required: true }
  submit: 'Submit'
  success: 'Thanks for submitting!'
sources:
  - kind: live
    ref: 'https://www.odysseaninstitute.org/contact'
    note: 'heading "CONTACT US" set in sentence case (presentational); email and phone come from settings'
  - kind: live
    ref: 'https://www.odysseaninstitute.org/'
    note: 'form fields, button and success message as on the live contact form'
  - kind: decision
    ref: 'build-plan AD10'
    note: 'required flags: name, email and message (needed to reply)'
---

Please reach out if you are interested in:

-   Learning more about our work

-   Partnering or collaborating with us

-   Funding some of our projects or activities

-   Engaging with our curriculum training
