// indicate which was the last mailbox accessed
var lastMailbox = false;


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


function compose_email(reply=null) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
    if (reply !== null) {
        document.querySelector('#compose-recipients').value = reply.sender;
        if (!reply.subject.startsWith('Re: ')) {
            document.querySelector('#compose-subject').value = `Re: ${reply.subject}`;
        } else {
            document.querySelector('#compose-subject').value = reply.subject;
        }
        document.querySelector('#compose-body').value = `On ${reply.timestamp} ${reply.sender} wrote: \n ${reply.body}`;
    } else {
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
    }
}


function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    lastMailbox = mailbox;

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

    // makes a PUT request to "/emails/<email_id>" to mark the email as read
    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });

    // makes a get request to "/emails/<email_id>" to request the email
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    // render the email
    .then(email => {
        const emailContent = document.createElement('div');
        emailContent.id = 'email-content'
        emailContent.className = 'container my-5';
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
        document.querySelector('#email-view').prepend(emailContent);

        // displays a button that lets users archive the emails if they're coming form the inbox mailbox
        const archiveButton = document.querySelector('#archive-button');
        if (lastMailbox === 'inbox') {
            archiveButton.style.display = 'block';
            archiveButton.innerHTML = 'Archive'
            archiveButton.className = 'btn btn-success';
            archiveButton.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: true
                    })
                })
            });
        }
        else if (lastMailbox === 'archive') {
            archiveButton.style.display = 'block';
            archiveButton.innerHTML = 'Unarchive'
            archiveButton.className = 'btn btn-danger';
            archiveButton.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: false
                    })
                });
            });
        }
        else {
            archiveButton.style.display = 'none';
        }

        // let's the user reply to the current email (reply button)
        const replyButton = document.querySelector('#reply-button');
        replyButton.addEventListener('click', () => {
            const replyData = {
                sender: email.sender,
                recipients: email.recipients,
                subject: email.subject,
                body: email.body,
                timestamp: email.timestamp
            };
            compose_email(replyData);
        });
    });
}