import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplate.js"
import { mailtrap_client, sender } from "./mailtrap.js"


export const sendVerificationEmail = async(email, verificationToken)=>{
    const recipient = [{email}]

    try{
        const response = await mailtrap_client.send({
          from: sender,
          to:recipient,
          subject:"Verify your email",
          html:VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
          category:"email verification"
        })
        console.log("email sent successfully", response);
    }
    catch(error){
        throw new Error (`Error sending verification code ${error}`)

    }
}

export const sendWelcomeEmail = async(email, name)=>{
    const recipient = [{email}]
    try {
       const response = await mailtrap_client.send({
        from: sender,
        to: recipient,
        template_uuid: "c11cb70d-c048-48d6-b6f3-17611297f53e",
        template_variables: {
      "company_info_name": "auth company",
      "name": name

       }})
       console.log("email sent successfully", response);
        
    }
    catch(error){
        throw new Error (`Error verifying  ${error}`)

    }
}