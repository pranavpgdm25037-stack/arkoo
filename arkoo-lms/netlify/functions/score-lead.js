import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { id, answers } = JSON.parse(event.body);

    if (!id || !answers) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing lead id or answers' }) };
    }

    // Prepare the prompt for Claude
    const prompt = `
      You are an expert sales qualifier for a web/software development agency.
      Score the following lead on a scale of 1 to 10 based on the quality of their project application.
      
      Evaluation Criteria:
      - High budget ($15k+) -> Higher score
      - Clear description and goals -> Higher score
      - Unrealistic timeline (ASAP for complex project) or very low budget -> Lower score
      
      Lead Application Details:
      Project Type: ${answers.projectType}
      Estimated Budget: ${answers.budget}
      Desired Timeline: ${answers.timeline}
      Project Description: ${answers.description}
      Key Goals & Metrics: ${answers.goals}
      
      Respond with a JSON object containing exactly two keys:
      1. "score" - an integer from 1 to 10
      2. "reasoning" - a short 1-2 sentence explanation of why you gave this score.
      
      Do not include any other text besides the JSON.
    `;

    // Call Claude API (using claude-3-5-sonnet-20241022 as requested/recommended)
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: "You are an expert sales qualifier. Always respond with valid JSON only.",
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    // Parse Claude's response
    const responseText = message.content[0].text.trim();
    let scoreResult;
    try {
      // Find JSON block in case Claude included markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      scoreResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing Claude response:', responseText);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to parse AI response' }) };
    }

    // Initialize Supabase service role client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save AI score and reasoning to Supabase
    const { error: dbError } = await supabase
      .from('leads')
      .update({ 
        ai_score: scoreResult.score,
        ai_reasoning: scoreResult.reasoning
      })
      .eq('id', id);

    if (dbError) {
      console.error('Supabase update error:', dbError);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save score to database' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Lead scored successfully', 
        score: scoreResult.score 
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
