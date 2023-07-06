import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

async function captureScreenshot(url: string, filePath: string) {
  const browser = await puppeteer.launch({  headless: "new",
  executablePath: "/usr/bin/google-chrome-stable"});
  const page = await browser.newPage();
  await page.goto(url);

    // Check the checkbox
    await page.evaluate(() => {
      const checkbox = document.querySelector('#condition') as HTMLInputElement;
      checkbox.checked = true;
    });
  
    // Submit the form
    await page.evaluate(() => {
      const submitButton = document.querySelector('#submit_Booking input[type="submit"]') as HTMLInputElement;
      submitButton.click();
    });
  
    await page.waitForNavigation(); // Wait for the page to load after form submission
    

// Check if the element indicating no available appointments exists on the page
//const noAvailabilityElement = await page.$('#inner_Booking form[name="create"]');
//const appointmentAvailable = !noAvailabilityElement;

// Check if the specific text indicating availability is present on the page
const availabilityText = await page.evaluate(() => {
  const innerBookingElement = document.querySelector('#inner_Booking');
  return innerBookingElement ? innerBookingElement.textContent?.trim() || '' : '';
});
const specificText = "Il n'existe plus de plage horaire libre pour votre demande de rendez-vous. Veuillez recommencer ultérieurement.";
const specificTextPresent = availabilityText.includes(specificText);  
    // Capture the screenshot

    if (!specificTextPresent) {
      console.log('Appointment available!');
      await sendEmailWithAttachment(filePath);
      await page.screenshot({ path: filePath });
    } else {
      console.log('Appointment not available!');
    }
  
    await browser.close();
  }
  async function checkAppointmentsEveryInterval(url: string, interval: number) {
    while (true) {
      const timestamp = new Date().toISOString();
      const filePath = path.join(__dirname, 'screenshots', `screenshot_${timestamp}.png`);
  
      await captureScreenshot(url, filePath);
      console.log(`Capture completed at ${timestamp}`);
  
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    }
  }

//  async function visitAndCapture(url: string, interval: number, totalCaptures: number) {
//   const screenshotsFolder = path.join(__dirname, 'screenshots');
//    fs.mkdirSync(screenshotsFolder, { recursive: true });

//    for (let i = 0; i < totalCaptures; i++) {
//      const timestamp = new Date().toISOString();
//      const filePath = path.join(screenshotsFolder, `screenshot_${timestamp}.png`);

//      await captureScreenshot(url, filePath);
//      console.log(`Capture ${i + 1} completed at ${timestamp}`);

//     await new Promise((resolve) => setTimeout(resolve, interval * 1000));
//    }
//  }

async function sendEmailWithAttachment(filePath: string) {
  // SMTP configuration for the email sender
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'noreplysmartcity33@gmail.com', // Replace with your Gmail email address
      pass: 'pjprjaophvsbkcgc', // Replace with your Gmail password or an app-specific password
    },
  });

  // Email options
  const mailOptions = {
    from: 'noreplysmartcity33@gmail.com', // Sender's email address
    to: 'hm_merabet@esi.dz', // Recipient's email address
    subject: 'Appointment Available', // Email subject
    text: 'An appointment is available!', // Email body
    attachments: [
      {
        filename: path.basename(filePath), // Filename of the captured screenshot
        path: filePath, // Path to the captured screenshot
      },
    ],
  };

  // Send the email
  await transporter.sendMail(mailOptions);
  console.log('Email sent successfully!');
}
const siteUrl = 'https://www.herault.gouv.fr/booking/create/15253/0'; // Replace with the URL of the site you want to visit
const captureInterval = 60*5; // Capture interval in seconds


checkAppointmentsEveryInterval(siteUrl, captureInterval)
  .catch((error) => console.error(error));

// visitAndCapture(siteUrl, captureInterval, totalCaptures)
//   .catch((error) => console.error(error));
//captureScreenshot(siteUrl, "screenshot.png").catch((error) => console.error(error));
