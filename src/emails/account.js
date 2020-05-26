const sgMail = require('@sendgrid/mail');
const sgApiKey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(sgApiKey);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        from: 'deepak.khetan.02@gmail.com',
        to: email,
        subject: 'Welcome to TaskManager App, the best place to manage your tasks!',
        text: `Hey ${name}!, \n Welcome to the TaskManager App. Use this app to manage all your day to day and critical tasks with alerts and accomplish more. \n\n Regards, \nYour Own Task Force`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        from: 'deepak.khetan.02@gmail.com',
        to: email,
        subject: 'Account deleted from TaskManager App, the best place to manage your tasks!',
        text: `Hey ${name}!, \n Hate to see you go but love to understand what we could have done to make this a better experience for you and keep you as our esteemed customer. Do reply to this email providing us with your valuable suggestion to improve. \n Good Bye for now and take care!.\n\n Regards, \nStill Your Own Task Force`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}