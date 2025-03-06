document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email)

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // make GET request to /emails/<mailbox>
    fetch(`/emails/${ mailbox }`)
    .then(response => response.json())
    .then(emails => {
        // render emails
        emails.forEach(email => {
            const emailCard = document.createElement('a');
            // this funky syntax is here so "view_email()" has access to the event and email.id
            emailCard.addEventListener('click', event => {
                view_email(event, email.id);
            });
            emailCard.href = ``;
            emailCard.className = 'link-dark text-decoration-none';
            emailCard.innerHTML = `
                <div id="email-${email.id}" class="container-fluid">
                    <div class="row d-flex justify-content-between border-top border-start border-end border-2">
                        <div class="col d-inline-flex">
                            <p class="fw-bold me-3">${email.sender}</p>
                            <p>${email.subject}</p>
                        </div>
                        <div class="col d-flex justify-content-end">
                            <p class="fw-light">${email.timestamp}</p>
                        </div>
                    </div>
                </div>
            `;
            document.querySelector('#emails-view').appendChild(emailCard);
            if (email.read === true) {
                document.querySelector(`#email-${email.id}`).className += ' bg-light';
            }
        });
        // fixing the border at the bottom
        document.querySelector('#emails-view').className += 'border-bottom border-2'
    });
}


function send_email(event) {
    // prevents the page from refreshing on submit
    event.preventDefault();

    // clear any previous error messages
    const errorAlertDiv = document.querySelector('#error-alert')
    errorAlertDiv.innerHTML = ''
    errorAlertDiv.style.display = 'none'

    // get contents of the compose form
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    // sends a POST request to the "/emails" route (sends the email).
    // "fetch()" returns a "promise" that resolves to a "response" object
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body,
            read: false
        })
    })
    // "response => response.json()" returns the JSON body of the response to the request made above as a promise
    // (this is done because parsing the json body could take some time and allows for further ".then" chaining)
    // 0-0: peep "compose()" in views.py to see the response bodies
    .then(response => response.json())
    // The "result" object below now contains the parsed json response
    .then(result => {
        // if there isn't an error in the parsed result
        if (result.error === undefined) {
            load_mailbox('sent');
        // if there is, then the user has to correct their email
        } else {
            errorAlertDiv.innerHTML = result.error;
            errorAlertDiv.style.display = 'block';
        }
    });

}


function view_email(event, email_id) {
    event.preventDefault();

    // show the email and hide the other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // delete any previously rendered emails
    const oldEmail = document.querySelector('#email-content');
    if (oldEmail !== null) {
        oldEmail.remove();
    }

    // makes a get request to "/emails/<email_id>" to request the email
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    // render the email
    .then(email => {
        const emailContent = document.createElement('div');
        emailContent.id = 'email-content'
        emailContent.className = 'container';
        emailContent.innerHTML = `
            <div class="row d-flex align-items-center mb-3">
                <div class="col d-flex justify-content-start">
                    <h1>${email.subject}</h1>
                </div>
                <div class="col d-flex justify-content-end">
                    <p class="fw-light">${email.timestamp}</p>
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <p class="span">From: ${email.sender}</p>
                    <p class="fw-light">To: ${email.recipients}</p>
                </div>
            </div>
            <div class="row d-flex justify-content-center">
                <div class="col-9 p-5 border mt-5">
                    <p>${email.body}</p>
                </div>
            </div>
        `;
        document.querySelector('#email-view').appendChild(emailContent);
    });

    // makes a PUT request to "/emails/<email_id>" to marek the email as read
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });
}