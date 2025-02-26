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
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
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
            body: body
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
            load_mailbox('sent')
        // if there is, then the user has to correct their email
        } else {
            errorAlertDiv.innerHTML = result.error
            errorAlertDiv.style.display = 'block'
        }
    });

}