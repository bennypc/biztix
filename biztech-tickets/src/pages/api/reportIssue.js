// pages/api/reportIssue.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Destructure the issue from the request body
    const { issue } = req.body;

    // Current timestamp
    const timestamp = new Date().toISOString();

    // Slack Webhook URL
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

    try {
      // Post the issue along with the timestamp to Slack
      await axios.post(SLACK_WEBHOOK_URL, {
        text: `New issue reported: ${issue}\nTimestamp: ${timestamp}`
      });

      return res.status(200).json({
        success: true,
        message: 'Issue reported to Slack successfully.'
      });
    } catch (error) {
      console.error('Error sending notification to Slack:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Failed to report issue to Slack.' });
    }
  } else {
    // Handle any requests that aren't POST
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
