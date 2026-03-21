const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate resume content using AI (used for manual entry/builder)
 */
const generateResumeContent = async (userInputs) => {
    try {
        console.log("Attempting resume generation with Groq...");
        const data = await generateWithGroq(userInputs);
        return sanitizeParsedData(data);
    } catch (groqError) {
        console.error("Groq generation failed, falling back to Gemini:", groqError.message);
        const data = await generateWithGemini(userInputs);
        return sanitizeParsedData(data);
    }
};

/**
 * Generate a professional self-introduction script (Elevator Pitch)
 */
const generateSelfIntro = async (resumeData) => {
    try {
        const prompt = getSelfIntroPrompt(resumeData);
        console.log("Generating Self Intro with Groq...");

        const apiCall = groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert career coach. Create a 1-minute professional intro script." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7
        });

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Groq timeout")), 20000)
        );

        const completion = await Promise.race([apiCall, timeout]);
        return { script: completion.choices[0].message.content.trim() };
    } catch (error) {
        console.warn("Self Intro Groq failed, using Gemini fallback:", error.message);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(getSelfIntroPrompt(resumeData));
        const response = await result.response;
        return { script: response.text().trim() };
    }
};

/**
 * Generate LinkedIn Profile Optimization content
 */
const generateLinkedInOptimization = async (resumeData) => {
    try {
        const prompt = getLinkedInPrompt(resumeData);
        console.log("Generating LinkedIn Optimization with Groq...");

        const apiCall = groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a LinkedIn Branding Expert. Create professional LinkedIn Profile content." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Groq timeout")), 25000)
        );

        const completion = await Promise.race([apiCall, timeout]);
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.warn("LinkedIn Optimizer Groq failed, using Gemini fallback:", error.message);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(getLinkedInPrompt(resumeData));
        const response = await result.response;
        return JSON.parse(response.text().trim());
    }
};

/**
 * Analyze Resume for ATS Heatmap
 */
const analyzeATSHeatmap = async (resumeData) => {
    try {
        const prompt = getATSHeatmapPrompt(resumeData);
        console.log("Generating ATS Heatmap with Groq...");

        const apiCall = groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert ATS Resume Analyst. Provide section-by-section analysis." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Groq timeout")), 25000)
        );

        const completion = await Promise.race([apiCall, timeout]);
        return extractJsonFromText(completion.choices[0].message.content);
    } catch (error) {
        console.warn("ATS Heatmap Groq failed, using Gemini fallback:", error.message);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(getATSHeatmapPrompt(resumeData));
        const response = await result.response;
        return extractJsonFromText(response.text().trim());
    }
};

/**
 * Parse resume from raw text (used for file uploads)
 */
const parseResumeFromText = async (rawText) => {
    try {
        console.log(`Attempting resume parsing with Gemini. Raw text length: ${rawText.length}`);
        return await parseWithGemini(rawText);
    } catch (geminiError) {
        console.error("Gemini parsing failed, falling back to Groq:", geminiError.message);
        return await parseWithGroq(rawText);
    }
};

// --- PRIVATE IMPLEMENTATIONS ---

const generateWithGroq = async (userInputs) => {
    const prompt = getGenerationPrompt(userInputs);

    // Add safety timeout for Groq
    const apiCall = groq.chat.completions.create({
        messages: [
            { role: "system", content: "You are an expert ATS Resume Builder. Return ONLY valid JSON." },
            { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        response_format: { type: "json_object" }
    });

    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Groq timeout after 30 seconds")), 30000)
    );

    const completion = await Promise.race([apiCall, timeout]);
    console.log("Groq generation successful.");
    return JSON.parse(completion.choices[0].message.content);
};

const parseWithGroq = async (rawText) => {
    const prompt = getParsingPrompt(rawText);

    console.log("Sending request to Groq...");
    const apiCall = groq.chat.completions.create({
        messages: [
            { role: "system", content: "You are an expert ATS Resume Parser. Return ONLY valid JSON." },
            { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" }
    });

    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Groq timeout after 30 seconds")), 30000)
    );

    const completion = await Promise.race([apiCall, timeout]);
    console.log("Groq parsing successful.");

    const parsedData = JSON.parse(completion.choices[0].message.content);
    return sanitizeParsedData(parsedData);
};

const sanitizeParsedData = (data) => {
    if (!data || typeof data !== 'object') data = {};

    // Ensure root level summary
    if (data.personalInfo && data.personalInfo.summary && !data.summary) {
        data.summary = data.personalInfo.summary;
    }

    // Ensure IDs and correct keys in arrays
    const sanitizeArray = (arr, titleKey) => {
        if (!Array.isArray(arr)) return [];
        return arr.map((item, i) => {
            if (typeof item !== 'object' || item === null) {
                return {
                    id: Date.now() + Math.floor(Math.random() * 1000) + i,
                    [titleKey]: String(item)
                };
            }

            // Robust Description Extraction: Check common keys the AI might use
            let description = item.description || item.details || item.content || item.bulletPoints || item.responsibilities || '';

            if (Array.isArray(description)) {
                // Ensure each point is a string and potentially add bullet if missing
                description = description
                    .filter(p => p && String(p).trim())
                    .map(p => {
                        let pt = String(p).trim();
                        return pt.startsWith('•') || pt.startsWith('-') || pt.startsWith('*') ? pt : `• ${pt}`;
                    })
                    .join('\n');
            } else if (typeof description === 'string' && description.trim()) {
                // Split by newline and ensure bullets
                description = description
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        let l = line.trim();
                        return l.startsWith('•') || l.startsWith('-') || l.startsWith('*') ? l : `• ${l}`;
                    })
                    .join('\n');
            }

            return {
                ...item,
                id: item.id || (Date.now() + Math.floor(Math.random() * 1000) + i),
                description: String(description)
            };
        });
    };

    data.experience = sanitizeArray(data.experience, 'title');
    data.education = sanitizeArray(data.education, 'degree');
    data.projects = sanitizeArray(data.projects, 'title');
    data.certifications = sanitizeArray(data.certifications, 'title');
    data.languages = sanitizeArray(data.languages, 'title');
    data.interests = sanitizeArray(data.interests, 'title');

    // Also sanitize customSections
    if (Array.isArray(data.customSections)) {
        data.customSections = data.customSections.map(section => ({
            ...section,
            items: sanitizeArray(section.items, 'title')
        }));
    }

    if (!data.personalInfo) data.personalInfo = {};
    if (data.personalInfo.name) {
        data.personalInfo.name = data.personalInfo.name.toUpperCase();
    }

    if (!data.sections) {
        data.sections = ['experience', 'education', 'skills', 'projects', 'certifications'];
    }

    return data;
};

const generateWithGemini = async (userInputs) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = getGenerationPrompt(userInputs);

    console.log("Calling Gemini (Fallback)...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return extractJsonFromText(text);
};

const parseWithGemini = async (rawText) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });

    const prompt = getParsingPrompt(rawText);

    console.log("Calling Gemini for Parse...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw AI Response Length:", text.length);
    console.log("Is JSON:", text.trim().startsWith('{'));

    const parsedData = extractJsonFromText(text);
    return sanitizeParsedData(parsedData);
};

// --- PROMPT HELPERS ---

const getGenerationPrompt = (userInputs) => {
    return `You are an expert ATS Optimizer. Analyze the provided details and create a professional resume.
    Details: ${JSON.stringify(userInputs)}
    
    CRITICAL MISSIONS:
    1. CONTENT: Optimize every section for ATS compatibility using industry-standard keywords.
    2. SCORING: Calculate a REAL "atsScore" (0-100) based on how well the input meets professional standards. Do NOT use 85 as a default.
    3. FEEDBACK: Provide 3 specific, ACTIONABLE advice points in "atsFeedback" array for further improvement. Do NOT use generic points.

    JSON Structure to return: {
        "suggestedTemplate": "ats-basic",
        "atsScore": <number_from_0_to_100>,
        "atsFeedback": ["specific_point_1", "specific_point_2", "specific_point_3"],
        "personalInfo": { "name": "UPPERCASE", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "portfolio": "", "summary": "" },
        "experience": [{ "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "description": ["Point 1", "Point 2"] }],
        "education": [{ "school": "", "degree": "", "location": "", "startDate": "", "endDate": "" }],
        "skills": [],
        "projects": [{ "title": "", "subtitle": "Tech Stack", "description": ["Point 1", "Point 2"] }],
        "certifications": ["Cert 1"]
    }`;
};

const getParsingPrompt = (rawText) => {
    return `You are an expert Resume Analyst and Data Extractor.
    
    MISSION 1: DATA EXTRACTION
    Copy and paste 100% of the content from the text below into the structured JSON. NEVER SUMMARIZE or shorten experience/projects. Extract literal full text.
    
    MISSION 2: ATS ANALYSIS (CRITICAL)
    Analyze the extracted content. Compare it against industry standards.
    Calculate a REAL "atsScore" (0-100) and provide 3 unique "atsFeedback" points specifically for THIS resume content.
    Do NOT use default values like 85 or generic feedback points. Be honest and accurate.
    
    TEXT TO ANALYZE: 
    """${rawText.substring(0, 35000)}"""
    
    STRICT JSON Structure to return: {
        "atsScore": <integer_calculated_score>,
        "atsFeedback": ["feedback_1", "feedback_2", "feedback_3"],
        "personalInfo": { 
            "name": "UPPERCASE", 
            "title": "Exact Header Title", 
            "email": "", "phone": "", "location": "", "linkedin": "", "portfolio": "", "github": ""
        },
        "summary": "Exact Summary Text",
        "experience": [
            { "company": "Co Name", "title": "Role", "location": "", "startDate": "", "endDate": "", "description": "LITERAL FULL DESCRIPTION" }
        ],
        "education": [
            { "school": "Institution", "degree": "Degree", "location": "", "startDate": "", "endDate": "" }
        ],
        "skills": ["skill1", "skill2"],
        "projects": [
            { "title": "Project Name", "subtitle": "Stack", "description": "LITERAL FULL DESCRIPTION" }
        ],
        "certifications": ["Cert 1"],
        "languages": ["Lang 1"],
        "interests": ["Interest 1"],
        "customSections": [
            { 
                "title": "SECTION NAME", 
                "items": [{ "title": "", "subtitle": "", "description": "LITERAL CONTENT" }]
            }
        ]
    }`;
};

const getSelfIntroPrompt = (data) => {
    return `Create a confident, professional 1-minute self-introduction script (Elevator Pitch) based on this resume data:
    Name: ${data.personalInfo?.name}
    Role: ${data.personalInfo?.title}
    Skills: ${data.skills?.join(', ')}
    Experience Summary: ${data.experience?.map(e => `${e.title} at ${e.company}`).join(', ')}
    Key Projects: ${data.projects?.map(p => p.title).join(', ')}

    STRUCTURE (Strictly followed):
    1. Greeting & Name (10s)
    2. Current Role/Background (15s) - Mention identity as a professional in ${data.personalInfo?.title || 'their field'}.
    3. Key Strengths & Skills (15s) - Highlight top skills from their list.
    4. Major Achievement/Project (15s) - Briefly mention one key project or impact.
    5. Closing Goal (5s) - "I'm excited to bring my skills to a challenging role..."

    TONE: Professional, confident, and engaging.
    LENGTH: Approx 150-180 words.
    FORMAT: Plain text with conversational flow. NO markdown headers.`;
};

const getLinkedInPrompt = (data) => {
    return `You are a LinkedIn Branding Expert. Based on the following resume data, generate optimized content for a LinkedIn profile.
    
    Resume Data:
    Name: ${data.personalInfo?.name}
    Role: ${data.personalInfo?.title}
    Summary: ${data.personalInfo?.summary || data.summary}
    Skills: ${data.skills?.join(', ')}
    Experience: ${JSON.stringify(data.experience)}
    Projects: ${JSON.stringify(data.projects)}

    OBJECTIVES:
    1. ABOUT SECTION: Create a compelling, first-person "About" section (approx 200-300 words). Use a mix of storytelling and professional achievements. Include a "Specialties" or "Top Skills" list at the end.
    2. EXPERIENCE SECTION: Provide optimized bullet points for the 2 most recent roles that highlight impact and results using the STAR method (Situation, Task, Action, Result).

    STRICT JSON Structure to return:
    {
        "about": "The full About section text here...",
        "experience": [
            {
                "company": "Company Name",
                "title": "Role Name",
                "optimizedPoints": ["Point 1", "Point 2", "Point 3"]
            }
        ],
        "headline": "A punchy LinkedIn headline (max 220 chars)"
    }`;
};

const getATSHeatmapPrompt = (data) => {
    return `You are a strict ATS system. Evaluate the following resume data section by section based on readability, action verbs, quantifiable metrics, and keyword density.
    
    Resume Data:
    Summary: ${data.personalInfo?.summary || data.summary}
    Skills: ${data.skills?.join(', ')}
    Experience: ${JSON.stringify(data.experience)}
    Education: ${JSON.stringify(data.education)}

    OBJECTIVES:
    For EACH section (summary, skills, experience, education), calculate a score out of 10.
    - Score 7 or higher: status is "good"
    - Score below 7: status is "needs_improvement"
    Provide 1 short, specific sentence of feedback per section.

    STRICT JSON Structure to return:
    {
        "summary": { "score": 8, "status": "good", "feedback": "Strong summary..." },
        "skills": { "score": 5, "status": "needs_improvement", "feedback": "Add more hard skills..." },
        "experience": { "score": 9, "status": "good", "feedback": "Great use of metrics..." },
        "education": { "score": 10, "status": "good", "feedback": "Clear and concise." }
    }`;
};

/**
 * Generate Cold Email Templates
 */
const generateColdEmailTemplates = async (resumeData) => {
    try {
        const prompt = getColdEmailPrompt(resumeData);
        console.log("Generating Cold Emails with Groq...");

        const apiCall = groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a Career Strategist and Professional Writer. Create effective cold email templates." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Groq timeout")), 25000)
        );

        const completion = await Promise.race([apiCall, timeout]);
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.warn("Cold Email Groq failed, using Gemini fallback:", error.message);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(getColdEmailPrompt(resumeData));
        const response = await result.response;
        return JSON.parse(response.text().trim());
    }
};

const getColdEmailPrompt = (data) => {
    return `You are a Career Strategist. Based on the following resume data, create 3 types of professional cold email templates.
    
    Resume Data:
    Name: ${data.personalInfo?.name}
    Role: ${data.personalInfo?.title}
    Skills: ${data.skills?.join(', ')}
    Recent Experience: ${data.experience?.[0]?.title} at ${data.experience?.[0]?.company}

    TEMPLATES TO GENERATE:
    1. JOB_APPLICATION: A direct email to a hiring manager for a specific open role.
    2. NETWORKING: A request for an informational interview or a brief chat to learn more about a company/industry.
    3. REFERRAL_REQUEST: A message to a former colleague or acquaintance asking for a referral.

    GUIDELINES:
    - Use placeholders like [Hiring Manager Name], [Company Name], [Job Title] where appropriate.
    - Keep them concise, professional, and personalized using the resume data.
    - Focus on the value the user adds.

    STRICT JSON Structure to return:
    {
        "jobApplication": {
            "subject": "Subject line...",
            "body": "Email body content..."
        },
        "networking": {
            "subject": "Subject line...",
            "body": "Email body content..."
        },
        "referralRequest": {
            "subject": "Subject line...",
            "body": "Email body content..."
        }
    }`;
};

const extractJsonFromText = (text) => {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("Invalid format");
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);
    console.log(`[AI SERVICE] Extracted Score: ${parsed.atsScore}, Feedback Count: ${parsed.atsFeedback?.length}`);
    return parsed;
};

module.exports = {
    generateResumeContent,
    parseResumeFromText,
    generateSelfIntro,
    generateLinkedInOptimization,
    generateColdEmailTemplates,
    analyzeATSHeatmap
};
