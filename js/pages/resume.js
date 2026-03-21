// ============================================
// CANVA-STYLE RESUME BUILDER
// ============================================



import api from '../services/api.js';

export class ResumePage {
    constructor() {
        this.element = null;
        this.selectedTemplate = localStorage.getItem('selectedTemplate') || 'professional';
        this.resumeData = this.loadResumeData();
        this.isViewMode = localStorage.getItem('resumeViewMode') === 'true';
        this.customization = {
            colorScheme: 'navy',
            fontFamily: 'Inter',
            fontSize: 'medium'
        };
        this.zoomLevel = 100;
        // this.init(); // REMOVED ASYNC INIT
    }

    // async init() removed to prevent backend fetch

    loadResumeData() {

        // Fallback to local storage or default
        const saved = localStorage.getItem('resumeData');
        if (saved) {
            let data;
            try {
                data = JSON.parse(saved);
            } catch (e) {
                console.error('Corrupt resume data, resetting:', e);
                data = null;
            }

            if (data && typeof data === 'object') {
                // specific migration for old data
                if (!data.customSections) data.customSections = [];
                if (!data.projects) data.projects = [];
                if (!data.certifications) data.certifications = [];
                if (!data.languages) data.languages = [];
                if (!data.interests) data.interests = [];
                if (!data.personalInfo) data.personalInfo = {};
                // Ensure active sections array exists
                if (!data.sections) data.sections = ['experience', 'education', 'skills'];

                return data;
            }
        }

        return {
            personalInfo: {
                name: 'Your Name',
                title: 'Professional Title',
                email: 'email@example.com',
                phone: '+1 234 567 8900',
                location: 'City, Country',
                linkedin: 'linkedin.com/in/yourname',
                photo: null
            },
            summary: 'Professional summary goes here. Click to edit and add your experience, skills, and career objectives.',
            experience: [
                {
                    id: Date.now(),
                    title: 'Job Title',
                    company: 'Company Name',
                    location: 'City, Country',
                    startDate: '2020',
                    endDate: 'Present',
                    description: 'Job description and achievements. Click to edit.'
                }
            ],
            education: [
                {
                    id: Date.now() + 1,
                    degree: 'Degree Name',
                    school: 'University Name',
                    location: 'City, Country',
                    startDate: '2016',
                    endDate: '2020',
                    description: 'Relevant coursework or achievements'
                }
            ],
            skills: ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4', 'Skill 5'],

            // New Sections
            projects: [],
            certifications: [],
            languages: ['English', 'Spanish'],
            interests: ['Reading', 'Traveling'],
            customSections: [], // { id, title, items: [{ id, title, subtitle, description }] }

            sections: ['experience', 'education', 'skills'] // Active sections list
        };
    }

    saveResumeData() {
        // Local Save
        localStorage.setItem('resumeData', JSON.stringify(this.resumeData));

        // Background Cloud Save (Auto-save)
        const currentId = localStorage.getItem('currentResumeId');
        api.resume.save({
            id: currentId,
            title: this.resumeData.personalInfo.name + " - Resume",
            templateId: this.selectedTemplate,
            data: this.resumeData
        }).then(res => {
            if (res && res._id && !currentId) {
                // If it was a new resume, store the ID returned by backend
                localStorage.setItem('currentResumeId', res._id);
            }
        }).catch(err => {
            console.warn('Auto-save failed:', err.message);
        });
    }

    render() {
        const page = document.createElement('div');
        page.className = `page resume-builder-page ${this.isViewMode ? 'view-mode' : ''}`;
        page.innerHTML = `
            <style>
                .resume-builder-page {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 80px);
                    background: #f5f7fa;
                }

                .conversion-success-banner {
                    background: #10b981;
                    color: white;
                    padding: 12px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    animation: slideDown 0.5s ease-out;
                }

                @keyframes slideDown {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }

                /* ATS Heatmap Styles */
                .ats-heatmap-active .resume-section {
                    transition: all 0.3s;
                    position: relative;
                }
                
                .ats-good {
                    background-color: rgba(16, 185, 129, 0.05) !important;
                    border: 1px dashed #10b981 !important;
                    border-radius: 8px;
                    padding: 10px;
                }
                
                .ats-bad {
                    background-color: rgba(239, 68, 68, 0.05) !important;
                    border: 1px dashed #ef4444 !important;
                    border-radius: 8px;
                    padding: 10px;
                }
                
                /* Tooltip for Heatmap */
                .ats-tooltip {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: #1f2937;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    z-index: 50;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.2s;
                    white-space: nowrap;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    pointer-events: none;
                }
                
                .ats-good:hover .ats-tooltip, .ats-bad:hover .ats-tooltip {
                    opacity: 1;
                    visibility: visible;
                    top: -30px;
                }

                .view-mode .editor-sidebar,
                .view-mode .magic-btn,
                .view-mode #undoBtn,
                .view-mode #redoBtn,
                .view-mode .zoom-controls,
                .view-mode .sidebar-tab,
                .view-mode .add-item-btn-container,
                .view-mode .add-section-container {
                    display: none !important;
                }

                .view-mode .canvas-area {
                    width: 100% !important;
                    padding: 20px !important;
                }
                
                /* AI Insights Styling */
                .ai-insights-container {
                    margin-bottom: 30px;
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    display: flex;
                    gap: 32px;
                    align-items: center;
                    border: 1px solid #eef2ff;
                }

                .score-gauge-wrapper {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    flex-shrink: 0;
                }

                .score-circle {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: conic-gradient(var(--score-color) var(--score-percent), #f3f4f6 0);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }

                .score-circle::after {
                    content: "";
                    position: absolute;
                    width: 85%;
                    height: 85%;
                    background: white;
                    border-radius: 50%;
                }

                .score-value-container {
                    position: relative;
                    z-index: 1;
                    text-align: center;
                }

                .score-number {
                    font-size: 28px;
                    font-weight: 800;
                    color: #1f2937;
                    line-height: 1;
                }

                .score-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #6b7280;
                    font-weight: 600;
                }

                .insights-content {
                    flex: 1;
                }

                .insights-header {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a1c21;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .feedback-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .feedback-item {
                    font-size: 13px;
                    color: #4b5563;
                    padding: 8px 12px;
                    background: #f8fafc;
                    border-left: 3px solid var(--score-color);
                    border-radius: 4px;
                    line-height: 1.4;
                    display: flex;
                    align-items: center;
                }
                
                .feedback-item::before {
                    content: '💡';
                    margin-right: 8px;
                }

                /* Teleprompter Styling */
                .teleprompter-content {
                    background: #1a1a1a;
                    color: #00ff00;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 24px;
                    line-height: 1.6;
                    padding: 40px;
                    border-radius: 8px;
                    height: 400px;
                    overflow-y: auto;
                    text-align: center;
                    position: relative;
                }

                .teleprompter-content::-webkit-scrollbar {
                    display: none;
                }

                .teleprompter-controls {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 20px;
                }

                .teleprompter-speed {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: white;
                }

                .teleprompter-active-line {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    height: 40px;
                    background: rgba(0, 255, 0, 0.1);
                    border-top: 1px dashed #00ff00;
                    border-bottom: 1px dashed #00ff00;
                    pointer-events: none;
                    transform: translateY(-50%);
                    z-index: 5;
                }

                .camera-preview-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    z-index: 1;
                    opacity: 0.4;
                }

                #cameraPreview {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transform: scaleX(-1); /* Mirror effect */
                }

                .teleprompter-content {
                    background: transparent;
                    color: #00ff00;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 24px;
                    line-height: 1.6;
                    padding: 40px;
                    border-radius: 8px;
                    height: 100%;
                    overflow-y: auto;
                    text-align: center;
                    position: relative;
                    z-index: 10;
                    text-shadow: 0 0 10px rgba(0, 255, 0, 0.7);
                }

                .btn-record {
                    background: #f43f5e;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .btn-record.recording {
                    background: #111;
                    animation: pulse-red 1.5s infinite;
                }

                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
                }

                .recording-status {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #f43f5e;
                    font-weight: 700;
                    z-index: 20;
                    display: none;
                }

                .recording-dot {
                    width: 12px;
                    height: 12px;
                    background: #f43f5e;
                    border-radius: 50%;
                    animation: blink 1s infinite;
                }

                @keyframes blink {
                    50% { opacity: 0; }
                }
                
                /* Top Toolbar */
                .resume-toolbar {
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 12px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                .toolbar-left {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                
                .toolbar-right {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                
                .toolbar-btn {
                    padding: 8px 16px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .toolbar-btn.magic-btn {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    color: white;
                    border: none;
                }

                .toolbar-btn.intro-btn {
                    background: linear-gradient(135deg, #ec4899, #f43f5e);
                    color: white;
                    border: none;
                }

                .toolbar-btn:hover {
                    background: #f9fafb;
                    border-color: #6366f1;
                }
                
                .toolbar-btn.primary {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white;
                    border: none;
                }
                
                .toolbar-btn.primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                
                .zoom-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 12px;
                    background: #f9fafb;
                    border-radius: 6px;
                }
                
                .zoom-btn {
                    background: white;
                    border: 1px solid #e5e7eb;
                    width: 28px;
                    height: 28px;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }
                
                .zoom-level {
                    font-size: 13px;
                    color: #6b7280;
                    min-width: 45px;
                    text-align: center;
                }
                
                /* Main Editor Layout */
                .editor-container {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }
                
                /* Sidebar */
                .editor-sidebar {
                    width: 320px;
                    background: white;
                    border-right: 1px solid #e5e7eb;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                
                .sidebar-tabs {
                    display: flex;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                }
                
                .sidebar-tab {
                    flex: 1;
                    padding: 12px;
                    text-align: center;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    color: #6b7280;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                
                .sidebar-tab:hover {
                    background: white;
                    color: #374151;
                }
                
                .sidebar-tab.active {
                    color: #6366f1;
                    border-bottom-color: #6366f1;
                    background: white;
                }
                
                .sidebar-content {
                    padding: 20px;
                    flex: 1;
                }
                
                .sidebar-section {
                    margin-bottom: 24px;
                }
                
                .sidebar-section h3 {
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 12px;
                }
                
                .color-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .color-option {
                    width: 100%;
                    aspect-ratio: 1;
                    border-radius: 8px;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.2s;
                }
                
                .color-option:hover {
                    transform: scale(1.1);
                }
                
                .color-option.active {
                    border-color: #374151;
                    box-shadow: 0 0 0 2px white, 0 0 0 4px #374151;
                }
                
                .font-option {
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-bottom: 8px;
                    transition: all 0.2s;
                }
                
                .font-option:hover {
                    border-color: #6366f1;
                    background: #f9fafb;
                }
                
                .font-option.active {
                    border-color: #6366f1;
                    background: #ede9fe;
                }
                
                /* Canvas Area */
                .canvas-area {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    padding: 40px;
                    overflow: auto;
                    background: #f5f7fa;
                }
                
                .resume-canvas {
                    background: white;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
                    width: 210mm;
                    min-height: 297mm;
                    transform-origin: top center;
                    transition: transform 0.3s;
                }
                
                /* Resume Template Styles */
                .resume-template {
                    padding: 20mm;
                    font-family: 'Inter', sans-serif;
                }
                
                .resume-header {
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                
                .photo-placeholder {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                }
                
                .photo-placeholder:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                }
                
                .photo-placeholder img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .header-text {
                    flex: 1;
                }
                
                .resume-name {
                    font-size: 32px;
                    font-weight: 700;
                    color: #1a202c;
                    margin-bottom: 8px;
                    cursor: text;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                
                .resume-name:hover {
                    background: #f9fafb;
                }
                
                .resume-title {
                    font-size: 18px;
                    color: #6366f1;
                    font-weight: 500;
                    cursor: text;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .resume-title:hover {
                    background: #f9fafb;
                }
                
                .contact-info {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-top: 12px;
                    font-size: 14px;
                    color: #6b7280;
                }
                
                .contact-item {
                    cursor: text;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                
                .contact-item:hover {
                    background: #f9fafb;
                }
                
                .resume-section {
                    margin-bottom: 24px;
                }
                
                .section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #6366f1;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #6366f1;
                }
                
                .section-item {
                    margin-bottom: 16px;
                }
                
                .item-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a202c;
                    cursor: text;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                
                .item-title:hover {
                    background: #f9fafb;
                }
                
                .item-subtitle {
                    font-size: 14px;
                    color: #6b7280;
                    margin-top: 4px;
                    cursor: text;
                    padding: 2px 4px;
                }
                
                .item-subtitle:hover {
                    background: #f9fafb;
                }
                
                .item-description {
                    font-size: 14px;
                    color: #374151;
                    margin-top: 8px;
                    line-height: 1.6;
                    cursor: text;
                    padding: 4px;
                    border-radius: 3px;
                }
                
                .item-description:hover {
                    background: #f9fafb;
                }
                
                .skills-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .skill-tag {
                    padding: 6px 12px;
                    background: #ede9fe;
                    color: #6366f1;
                    border-radius: 6px;
                    font-size: 14px;
                    cursor: text;
                }
                
                .skill-tag:hover {
                    background: #ddd6fe;
                }
                
                [contenteditable="true"] {
                    outline: 2px solid #6366f1;
                    outline-offset: 2px;
                }
                
                @media print {
                    /* Hide EVERYTHING by default */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Show only the resume canvas and its children */
                    #resumeCanvas, #resumeCanvas * {
                        visibility: visible;
                    }
                    
                    /* Position canvas at the very top left */
                    #resumeCanvas {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        transform: none !important; /* Ensure no scale is applied */
                    }

                    /* Hide specific UI wrappers that might still take space */
                    .resume-toolbar, 
                    .editor-sidebar, 
                    .conversion-success-banner, 
                    .ai-insights-container,
                    .nav-container,
                    header,
                    footer {
                        display: none !important;
                    }

                    .canvas-area {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        width: 100% !important;
                    }
                    
                    /* Force A4 size if possible */
                    @page {
                        size: A4;
                        margin: 1cm; /* Add some margin for the PDF */
                    }

                    /* Prevent elements from being cut across pages */
                    .resume-section {
                        page-break-inside: auto;
                        break-inside: auto;
                    }

                    .section-title {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }

                    .section-item, 
                    .skill-tag,
                    .item-header {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }

                .section-toggle-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                
                .section-toggle-item label {
                    margin-left: 8px;
                    font-size: 14px;
                    color: #374151;
                    cursor: pointer;
                }

                /* AI Modal Styles */
                .ai-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(5px);
                }

                .ai-modal {
                    background: white;
                    border-radius: 12px;
                    width: 500px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    padding: 24px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    position: relative;
                    animation: modalSlideIn 0.3s ease-out;
                }

                @keyframes modalSlideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(5px);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                }

                .modal-content {
                    background: #262626;
                    border: 1px solid #444;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    padding: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .ai-modal h2 {
                    margin-top: 0;
                    color: #111827;
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .ai-modal p {
                    color: #6b7280;
                    margin-bottom: 20px;
                    font-size: 0.95rem;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 6px;
                }

                .form-group input, .form-group textarea, .form-group select {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 0.95rem;
                    transition: border-color 0.15s;
                }

                .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 24px;
                }

                .btn-secondary {
                    background: white;
                    border: 1px solid #d1d5db;
                    color: #374151;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .btn-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            
            ${this.isViewMode ? `
            <div class="conversion-success-banner">
                <span>✨ Your ATS-Friendly Resume is Ready! We've extracted exactly what you uploaded.</span>
            </div>
            ${this.renderAIInsights(this.resumeData)}
            ` : ''}

            <!-- Top Toolbar -->
            <div class="resume-toolbar">
                <div class="toolbar-left">
                    <button class="toolbar-btn" id="backBtn">← Back to Templates</button>
                    <div class="zoom-controls">
                        <button class="zoom-btn" id="zoomOut">−</button>
                        <span class="zoom-level" id="zoomLevel">100%</span>
                        <button class="zoom-btn" id="zoomIn">+</button>
                    </div>
                </div>
                <div class="toolbar-right">
                    <button class="toolbar-btn" id="atsHeatmapBtn" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; margin-right: 10px;">🔍 Scan ATS Heatmap</button>
                    <button class="toolbar-btn magic-btn" id="aiGenerateBtn" style="background: linear-gradient(135deg, #FF6B6B, #FF8E53); color: white; border: none;">✨ AI Generate</button>
                    <button class="toolbar-btn" id="saveResumeBtn" style="border: 1px solid #10b981; color: #10b981; background: white; margin-right: 10px;">💾 Save Resume</button>
                    <button class="toolbar-btn" id="undoBtn">↶ Undo</button>
                    <button class="toolbar-btn" id="editResumeBtn" style="display: ${this.isViewMode ? 'flex' : 'none'}; border: 1px solid #6366f1; color: #6366f1; background: white; margin-right: 10px;">✏️ Edit Resume</button>
                    <button class="toolbar-btn primary" id="downloadBtn">⬇ Download PDF</button>
                </div>
            </div>
            
            <!-- Main Editor -->
            <div class="editor-container">
                <!-- Sidebar -->
                <div class="editor-sidebar">
                    <div class="sidebar-tabs">
                        <div class="sidebar-tab active" data-tab="customize">🎨 Customize</div>
                        <div class="sidebar-tab" data-tab="sections">📄 Sections</div>
                        <div class="sidebar-tab" data-tab="photo">📷 Photo</div>
                    </div>
                    
                    <div class="sidebar-content">
                        <!-- Customize Tab -->
                        <div class="tab-content active" data-content="customize">
                            <div class="sidebar-section">
                                <h3>Color Theme</h3>
                                <div class="color-grid" id="colorGrid"></div>
                            </div>
                            
                            <div class="sidebar-section">
                                <h3>Font Family</h3>
                                <div id="fontOptions"></div>
                            </div>
                        </div>
                        
                        <!-- Sections Tab -->
                        <div class="tab-content" data-content="sections" style="display: none;">
                            <div class="sidebar-section">
                                <h3>Standard Sections</h3>
                                <div class="section-toggles">
                                    ${this.renderSectionToggle('experience', 'Experience')}
                                    ${this.renderSectionToggle('education', 'Education')}
                                    ${this.renderSectionToggle('skills', 'Skills')}
                                    ${this.renderSectionToggle('projects', 'Projects')}
                                    ${this.renderSectionToggle('certifications', 'Certifications')}
                                    ${this.renderSectionToggle('languages', 'Languages')}
                                    ${this.renderSectionToggle('interests', 'Interests')}
                                </div>
                            </div>

                             <div class="sidebar-section">
                                <h3>Custom Sections</h3>
                                <div id="customSectionsList">
                                    ${this.resumeData.customSections.map(section => `
                                        <div class="section-toggle-item">
                                            <div style="flex: 1;">
                                                <input type="checkbox" id="toggle-${section.id}" 
                                                    ${this.resumeData.sections.includes(section.id) ? 'checked' : ''}
                                                    data-section="${section.id}">
                                                <label for="toggle-${section.id}">${section.title}</label>
                                            </div>
                                            <button class="delete-section-btn" data-id="${section.id}" style="border: none; background: none; color: #ef4444; cursor: pointer;">🗑️</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button class="toolbar-btn" id="addCustomSectionBtn" style="width: 100%; margin-top: 10px; border-style: dashed;">+ Add Custom Section</button>
                            </div>
                        </div>
                        
                        <!-- Photo Tab -->
                        <div class="tab-content" data-content="photo" style="display: none;">
                            <div class="sidebar-section">
                                <h3>Profile Photo</h3>
                                <input type="file" id="photoInput" accept="image/*" style="display: none;">
                                <button class="toolbar-btn" style="width: 100%; margin-bottom: 10px;" id="uploadPhotoBtn">📷 Upload Photo</button>
                                <button class="toolbar-btn" style="width: 100%; border-color: #ef4444; color: #ef4444;" id="removePhotoBtn">❌ Remove Photo</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Canvas Area -->
                <div class="canvas-area">
                    <div class="resume-canvas" id="resumeCanvas">
                        ${this.renderTemplate()}
                    </div>
                </div>
            </div>

            <!-- AI Generation Modal -->
            <div class="ai-modal-overlay" id="aiModal" style="display: none;">
                <div class="ai-modal">
                    <h2>✨ AI Resume Generator</h2>
                    <p>Enter your details and let AI write a professional resume for you.</p>
                    
                    <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="aiName" placeholder="e.g. JOHN DOE" value="${this.resumeData.personalInfo.name !== 'Your Name' ? this.resumeData.personalInfo.name : ''}">
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="aiEmail" placeholder="e.g. john@example.com" value="${this.resumeData.personalInfo.email !== 'email@example.com' ? this.resumeData.personalInfo.email : ''}">
                        </div>
                    </div>

                    <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label>Phone Number</label>
                            <input type="text" id="aiPhone" placeholder="e.g. +91 9876543210" value="${this.resumeData.personalInfo.phone !== '+1 234 567 8900' ? this.resumeData.personalInfo.phone : ''}">
                        </div>
                        <div class="form-group">
                            <label>Location</label>
                            <input type="text" id="aiLocation" placeholder="e.g. Chennai, India" value="${this.resumeData.personalInfo.location !== 'City, Country' ? this.resumeData.personalInfo.location : ''}">
                        </div>
                    </div>

                    <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                        <div class="form-group">
                            <label>LinkedIn URL</label>
                            <input type="text" id="aiLinkedin" placeholder="linkedin.com/in/username" value="${this.resumeData.personalInfo.linkedin || ''}">
                        </div>
                        <div class="form-group">
                            <label>GitHub URL</label>
                            <input type="text" id="aiGithub" placeholder="github.com/username" value="${this.resumeData.personalInfo.github || ''}">
                        </div>
                        <div class="form-group">
                            <label>Portfolio/Other</label>
                            <input type="text" id="aiPortfolio" placeholder="portfolio.com" value="${this.resumeData.personalInfo.portfolio || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Candidate Category</label>
                        <select id="aiCategory">
                            <option value="Student / Fresher">Student / Fresher</option>
                            <option value="IT Experienced Professional">IT Experienced Professional</option>
                            <option value="Non-IT Experienced">Non-IT Experienced</option>
                            <option value="Career Switcher">Career Switcher</option>
                            <option value="Doctor / Healthcare Professional">Doctor / Healthcare Professional</option>
                            <option value="School Teacher">School Teacher</option>
                            <option value="University Professor / Lecturer">University Professor / Lecturer</option>
                            <option value="Core Engineering (Mechanical, Civil, etc.)">Core Engineering (Mechanical, Civil, etc.)</option>
                            <option value="Business / MBA / Management">Business / MBA / Management</option>
                            <option value="Design / Creative Arts">Design / Creative Arts</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Target Job Role</label>
                        <input type="text" id="aiJobRole" placeholder="e.g. Frontend Developer, Marketing Manager">
                    </div>

                    <div class="form-group">
                        <label style="color: #6366f1; font-weight: 700;">✨ Job Description Matcher (Optional)</label>
                        <textarea id="aiJobDescription" rows="3" placeholder="Paste the Job Description here to tailor your resume specifically for this role and get a match score!"></textarea>
                    </div>


                    <div class="form-group" id="aiExperienceGroup">
                        <label>Experience Level</label>
                        <select id="aiExperience">
                            <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                            <option value="Mid Level (3-5 years)">Mid Level (3-5 years)</option>
                            <option value="Senior Level (5+ years)">Senior Level (5+ years)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label id="aiWorkHistoryLabel">Detailed Work Experience / Internships</label>
                        <textarea id="aiWorkHistory" rows="3" placeholder="List your key roles, companies, and what you did there (e.g., Intern at Google - Worked on React apps; Developer at TCS - Handled backend APIs)"></textarea>
                    </div>

                    <div class="form-group">
                        <label>Key Projects</label>
                        <textarea id="aiProjects" rows="2" placeholder="Describe 1-2 important projects you've worked on..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Education (Degree & University)</label>
                        <input type="text" id="aiEducation" placeholder="e.g. B.Tech Computer Science, Anna University">
                    </div>
                    
                    <div class="form-group">
                        <label>Key Skills (comma separated)</label>
                        <input type="text" id="aiSkills" placeholder="e.g. React, Node.js, Team Leadership">
                    </div>

                    <div class="form-group">
                        <label>Certifications & Achievements</label>
                        <input type="text" id="aiCertifications" placeholder="e.g. AWS Cloud Practitioner, Best Outgoing Student">
                    </div>

                    <div class="form-group">
                        <label>Additional Info / Bio (Optional)</label>
                        <textarea id="aiBio" rows="2" placeholder="Briefly describe your background or specific achievements you want to highlight..."></textarea>
                    </div>

                    <div class="modal-actions" style="margin-top: 25px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                        <button class="btn-secondary" id="closeAiModal" style="flex: 1; padding: 10px; font-size: 14px;">Cancel</button>
                        <button class="btn-primary intro-btn" id="selfIntroBtn" style="flex: 1.5; background: linear-gradient(135deg, #ec4899, #f43f5e); border: none; padding: 10px; font-size: 14px; color: white; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            🎙️ Self Intro
                        </button>
                        <button class="btn-primary" id="generateAiBtn" style="flex: 1.5; padding: 10px; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            ✨ Generate
                        </button>
                    </div>
                    <div style="margin-top: 15px; border-top: 1px solid #444; padding-top: 15px; text-align: center;">
                        <button class="btn-secondary" id="linkedinOptimizeBtn" style="width: 100%; background: #0077b5; color: white; border: none; padding: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            LinkedIn Optimizer
                        </button>
                    </div>
                    <div style="margin-top: 10px; text-align: center;">
                        <button class="btn-secondary" id="coldEmailBtn" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px; font-weight: 600; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            ✉️ Cold Email Templates
                        </button>
                    </div>
                </div>
            </div>

            <!-- Self Intro Modal -->
            <div id="introModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 style="color: white;">🎙️ AI Self Intro Teleprompter</h2>
                        <button class="close-btn" id="closeIntroModal" style="color: white;">&times;</button>
                    </div>
                    <div class="teleprompter-container" style="position: relative; overflow: hidden; height: 400px; margin: 20px 0; border: 1px solid #444; border-radius: 8px; background: #000;">
                        <div class="recording-status" id="recordingStatus">
                            <div class="recording-dot"></div>
                            <span>REC</span>
                        </div>
                        <div class="camera-preview-container">
                            <video id="cameraPreview" autoplay muted playsinline></video>
                        </div>
                        <div class="teleprompter-active-line"></div>
                        <div class="teleprompter-content" id="teleprompterContent">
                            <div style="padding: 150px 0;">Generating your personalized script...</div>
                        </div>
                    </div>
                    <div class="teleprompter-controls">
                        <button class="btn-primary" id="startTeleprompter">Start Practice</button>
                        <button class="btn-record" id="recordIntroBtn">
                            <span>🔴 Record intro</span>
                        </button>
                        <button class="btn-secondary" id="resetTeleprompter">Reset</button>
                        <div class="teleprompter-speed">
                            <span>Speed:</span>
                            <input type="range" id="scrollSpeed" min="1" max="10" value="3" style="width: 100px;">
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            <!-- LinkedIn Optimizer Modal -->
            <div id="linkedinModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 800px; border-radius: 12px; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <div class="modal-header" style="background: #0077b5; padding: 15px 20px; border-top-left-radius: 10px; border-top-right-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="color: white; margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1.4rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            LinkedIn Profile Optimizer
                        </h2>
                        <button class="close-btn" id="closeLinkedinModal" style="color: white; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    <div class="linkedin-content" style="padding: 25px; color: #e5e7eb; max-height: 550px; overflow-y: auto; background: #111827; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                        <div id="linkedinLoading" style="text-align: center; padding: 40px;">
                            <div class="spinner" style="border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: #0077b5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                            <style>
                                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            </style>
                            <p style="color: #9ca3af; font-size: 1rem;">Analyzing your resume for LinkedIn branding...</p>
                        </div>
                        <div id="linkedinResults" style="display: none;">
                            <div class="linkedin-section" style="margin-bottom: 30px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <h3 style="color: #60a5fa; margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                                        ✨ Optimized Headline
                                    </h3>
                                    <button class="btn-copy" id="copyLinkedinHeadline" style="background: #374151; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s;">Copy</button>
                                </div>
                                <div id="linkedinHeadline" style="background: rgba(59, 130, 246, 0.1); padding: 18px; border-radius: 10px; border-left: 4px solid #3b82f6; font-size: 15px; line-height: 1.5; color: white;"></div>
                            </div>

                            <div class="linkedin-section" style="margin-bottom: 30px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <h3 style="color: #60a5fa; margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                                        ✍️ About Section
                                    </h3>
                                    <button class="btn-copy" id="copyLinkedinAbout" style="background: #374151; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s;">Copy</button>
                                </div>
                                <div id="linkedinAbout" style="background: rgba(59, 130, 246, 0.1); padding: 18px; border-radius: 10px; border-left: 4px solid #3b82f6; font-size: 14px; line-height: 1.7; white-space: pre-wrap; color: #d1d5db;"></div>
                            </div>

                            <div class="linkedin-section">
                                <h3 style="color: #60a5fa; margin-bottom: 15px; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                                    🚀 Professional Experience Highlights
                                </h3>
                                <div id="linkedinExperience"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Cold Email Modal -->
            <div id="coldEmailModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 800px; border-radius: 12px; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                    <div class="modal-header" style="background: linear-gradient(135deg, #10b981, #059669); padding: 15px 20px; border-top-left-radius: 10px; border-top-right-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="color: white; margin: 0; font-size: 1.4rem;">✉️ Cold Email Templates</h2>
                        <button id="closeColdEmailModal" style="color: white; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    <div style="padding: 25px; color: #e5e7eb; max-height: 550px; overflow-y: auto; background: #111827; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                        <div id="coldEmailLoading" style="text-align: center; padding: 40px;">
                            <div style="border: 4px solid rgba(255,255,255,0.1); border-left-color: #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                            <p style="color: #9ca3af; font-size: 1rem;">Crafting personalized email templates from your resume...</p>
                        </div>
                        <div id="coldEmailResults" style="display: none;">
                            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                                <button class="cold-email-tab active" data-tab="jobApplication" style="flex:1; padding:9px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px;">📋 Job Application</button>
                                <button class="cold-email-tab" data-tab="networking" style="flex:1; padding:9px; background:#374151; color:#9ca3af; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px;">🤝 Networking</button>
                                <button class="cold-email-tab" data-tab="referralRequest" style="flex:1; padding:9px; background:#374151; color:#9ca3af; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px;">🔗 Referral</button>
                            </div>
                            <div id="tab-jobApplication" class="cold-email-panel">
                                <div style="margin-bottom:14px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <label style="color:#60a5fa; font-size:13px; font-weight:600;">SUBJECT</label>
                                        <button class="btn-copy-email" data-target="ceSubjectJobApplication" style="background:#374151; color:white; border:none; padding:4px 12px; border-radius:5px; font-size:12px; cursor:pointer;">Copy</button>
                                    </div>
                                    <div id="ceSubjectJobApplication" style="background:rgba(16,185,129,0.1); padding:12px; border-radius:8px; border-left:3px solid #10b981; font-size:14px; color:white;"></div>
                                </div>
                                <div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <label style="color:#60a5fa; font-size:13px; font-weight:600;">BODY</label>
                                        <button class="btn-copy-email" data-target="ceBodyJobApplication" style="background:#374151; color:white; border:none; padding:4px 12px; border-radius:5px; font-size:12px; cursor:pointer;">Copy</button>
                                    </div>
                                    <div id="ceBodyJobApplication" style="background:rgba(16,185,129,0.05); padding:14px; border-radius:8px; border-left:3px solid #10b981; font-size:14px; line-height:1.7; white-space:pre-wrap; color:#d1d5db;"></div>
                                </div>
                            </div>
                            <div id="tab-networking" class="cold-email-panel" style="display:none;">
                                <div style="margin-bottom:14px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <label style="color:#60a5fa; font-size:13px; font-weight:600;">SUBJECT</label>
                                        <button class="btn-copy-email" data-target="ceSubjectNetworking" style="background:#374151; color:white; border:none; padding:4px 12px; border-radius:5px; font-size:12px; cursor:pointer;">Copy</button>
                                    </div>
                                    <div id="ceSubjectNetworking" style="background:rgba(16,185,129,0.1); padding:12px; border-radius:8px; border-left:3px solid #10b981; font-size:14px; color:white;"></div>
                                </div>
                                <div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <label style="color:#60a5fa; font-size:13px; font-weight:600;">BODY</label>
                                        <button class="btn-copy-email" data-target="ceBodyNetworking" style="background:#374151; color:white; border:none; padding:4px 12px; border-radius:5px; font-size:12px; cursor:pointer;">Copy</button>
                                    </div>
                                    <div id="ceBodyNetworking" style="background:rgba(16,185,129,0.05); padding:14px; border-radius:8px; border-left:3px solid #10b981; font-size:14px; line-height:1.7; white-space:pre-wrap; color:#d1d5db;"></div>
                                </div>
                            </div>
                            <div id="tab-referralRequest" class="cold-email-panel" style="display:none;">
                                <div style="margin-bottom:14px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <label style="color:#60a5fa; font-size:13px; font-weight:600;">SUBJECT</label>
                                        <button class="btn-copy-email" data-target="ceSubjectReferralRequest" style="background:#374151; color:white; border:none; padding:4px 12px; border-radius:5px; font-size:12px; cursor:pointer;">Copy</button>
                                    </div>
                                    <div id="ceSubjectReferralRequest" style="background:rgba(16,185,129,0.1); padding:12px; border-radius:8px; border-left:3px solid #10b981; font-size:14px; color:white;"></div>
                                </div>
                                <div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                        <label style="color:#60a5fa; font-size:13px; font-weight:600;">BODY</label>
                                        <button class="btn-copy-email" data-target="ceBodyReferralRequest" style="background:#374151; color:white; border:none; padding:4px 12px; border-radius:5px; font-size:12px; cursor:pointer;">Copy</button>
                                    </div>
                                    <div id="ceBodyReferralRequest" style="background:rgba(16,185,129,0.05); padding:14px; border-radius:8px; border-left:3px solid #10b981; font-size:14px; line-height:1.7; white-space:pre-wrap; color:#d1d5db;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.element = page;
        this.attachEventListeners();
        return page;
    }

    renderTemplate() {
        try {
            // refresh data reference
            const data = this.resumeData;
            const templateId = this.selectedTemplate;
            const layoutType = this.getLayoutType(templateId);

            // Get layout-specific styles
            let styles = this.getTemplateStyles(layoutType);
            if (!styles) {
                console.warn('Styles missing for layout:', layoutType);
                styles = '';
            }

            // Common styles for all templates
            const commonStyles = `
            .resume-template { 
                padding: 0; 
                height: 100%; 
                font-family: inherit;
                color: #333;
                background: white;
                position: relative;
            }
            .photo-placeholder {
                background: #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                overflow: hidden;
            }
            .photo-placeholder img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            [contenteditable="true"]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                font-style: italic;
            }
            [contenteditable="true"]:focus {
                outline: 2px dashed #6366f1;
                outline-offset: 2px;
                min-width: 10px;
            }
            .description-list {
                margin: 5px 0 0 0;
                padding-left: 18px;
                list-style-type: disc;
            }
            .description-list li {
                margin-bottom: 4px;
                line-height: 1.4;
            }
            .description-list li:last-child {
                margin-bottom: 0;
            }
        `;

            // Wrap content in a scoped div with styles
            return `
            <style>
                ${commonStyles}
                ${styles}
            </style>
            <div class="resume-template layout-${layoutType}" id="templateRoot">
                ${this.renderLayoutContent(layoutType, data).replace(/contenteditable="true"/g, `contenteditable="${!this.isViewMode}"`)}
            </div>
        `;
        } catch (e) {
            console.error('Render Error:', e);
            return `<div style="padding: 20px; color: red; border: 1px solid red;">
                <h3>Error Rendering Resume</h3>
                <p>${e.message}</p>
                <pre>${e.stack}</pre>
            </div>`;
        }
    }

    renderLayoutContent(layoutType, data) {
        let content = '';
        switch (layoutType) {
            case 'bordered-header': content = this.renderBorderedHeader(data); break;
            case 'side-accent': content = this.renderSideAccent(data); break;
            case 'minimal-header': content = this.renderMinimalHeader(data); break;
            case 'two-column': content = this.renderTwoColumn(data); break;
            case 'full-gradient': content = this.renderFullGradient(data); break;
            case 'split-design': content = this.renderSplitDesign(data); break;
            case 'modern-grid': content = this.renderModernGrid(data); break;
            case 'timeline-layout': content = this.renderTimelineLayout(data); break;
            case 'infographic-style': content = this.renderInfographicStyle(data); break;
            case 'ats-standard': content = this.renderATSStandard(data); break;
            case 'gradient-header':
            default: content = this.renderGradientHeader(data); break;
        }

        // Add custom sections and the big "Add Section" button to ALL layouts
        // We inject it before the closing div if possible, else append
        return content + this.renderCustomSections(data) + this.renderAddSectionButton();
    }

    addItem(sectionKey) {
        if (!this.resumeData[sectionKey]) this.resumeData[sectionKey] = [];

        let newItem = { id: Date.now() };

        if (sectionKey === 'experience') {
            newItem = { ...newItem, title: 'Job Title', company: 'Company', location: 'Location', startDate: '2023', endDate: 'Present', description: 'Description' };
        } else if (sectionKey === 'education') {
            newItem = { ...newItem, degree: 'Degree', school: 'School', location: 'Location', startDate: '2020', endDate: '2024', description: 'Description' };
        } else if (sectionKey === 'projects') {
            newItem = { ...newItem, title: 'Project Title', subtitle: 'Role / Tech Stack', description: 'Project Description' };
        } else if (sectionKey === 'languages' || sectionKey === 'interests') {
            newItem = { ...newItem, title: 'Item Name', subtitle: 'Detail', description: 'Description' };
        }

        this.resumeData[sectionKey].push(newItem);
        this.saveResumeData();
        this.element.querySelector('#resumeCanvas').innerHTML = this.renderTemplate();
        this.attachDynamicListeners();
    }

    addCustomItem(sectionId) {
        const section = this.resumeData.customSections.find(s => s.id === sectionId);
        if (section) {
            section.items.push({
                id: Date.now(),
                title: 'Item Title',
                subtitle: 'Subtitle',
                description: 'Description'
            });
            this.saveResumeData();
            this.element.querySelector('#resumeCanvas').innerHTML = this.renderTemplate();
            this.attachDynamicListeners();
        }
    }

    async handleAIGeneration() {
        const generateBtn = this.element.querySelector('#generateAiBtn');
        const originalBtnText = generateBtn?.innerHTML;

        try {
            const name = this.element.querySelector('#aiName')?.value;
            const email = this.element.querySelector('#aiEmail')?.value;
            const phone = this.element.querySelector('#aiPhone')?.value;
            const location = this.element.querySelector('#aiLocation')?.value;
            const linkedin = this.element.querySelector('#aiLinkedin')?.value;
            const github = this.element.querySelector('#aiGithub')?.value;
            const portfolio = this.element.querySelector('#aiPortfolio')?.value;
            const category = this.element.querySelector('#aiCategory')?.value;
            const jobRole = this.element.querySelector('#aiJobRole')?.value;
            const experience = this.element.querySelector('#aiExperience')?.value;
            const skills = this.element.querySelector('#aiSkills')?.value;
            const education = this.element.querySelector('#aiEducation')?.value;
            const workHistory = this.element.querySelector('#aiWorkHistory')?.value;
            const projects = this.element.querySelector('#aiProjects')?.value;
            const certifications = this.element.querySelector('#aiCertifications')?.value;
            const bio = this.element.querySelector('#aiBio')?.value;
            const jobDescription = this.element.querySelector('#aiJobDescription')?.value;

            if (!jobRole || !skills) {
                alert('Please fill in Job Role and Skills');
                return;
            }

            // Show loading state
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<div class="loading-spinner"></div> Generating...';
            }

            // Get token
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Please login to use this feature');
            }

            // Call API
            const data = await api.resume.generate({
                name,
                email,
                phone,
                location,
                linkedin,
                github,
                portfolio,
                category,
                jobRole,
                experience,
                skills,
                education,
                workHistory,
                projects,
                certifications,
                bio_data: bio,
                jobDescription: jobDescription
            });

            // Success - update resume data
            // Conserve some existing settings like custom sections list structure if needed, 
            // but mostly replace content.

            // Handle fresher mode layout if suggested
            if (data.fresherMode) {
                // For freshers, priority is usually Education > Projects > Skills > Experience
                data.sections = ['education', 'projects', 'skills', 'experience', 'certifications', 'languages', 'interests'];
            } else {
                data.sections = ['experience', 'skills', 'projects', 'education', 'certifications', 'languages', 'interests'];
            }

            // Force ATS template and View Mode for AI-generated resumes
            this.selectedTemplate = 'ats-basic';
            localStorage.setItem('selectedTemplate', 'ats-basic');

            this.isViewMode = true;
            localStorage.setItem('resumeViewMode', 'true');

            // Merge generated data with existing structure
            this.resumeData = {
                ...this.resumeData,
                ...data,
            };

            // Force save and FULL re-render to apply view-mode classes
            this.saveResumeData();
            this.element.innerHTML = this.render().innerHTML;
            this.attachEventListeners();

            // Display Match Score and Insights
            if (data.matchScore) {
                this.showMatchInsights(data.matchScore, data.matchInsights);
            }

            // Close modal is handled by re-render, but for safety:
            const modal = document.querySelector('#aiModal');
            if (modal) modal.style.display = 'none';

            // Optional: Show success feedback
            // alert('Resume generated successfully!');

        } catch (error) {
            console.error('AI Generation Error:', error);
            alert('Failed to generate resume: ' + error.message);
        } finally {
            // Reset button
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnText;
        }
    }



    getLayoutType(templateId) {
        // Should match templateGallery.js logic
        const variations = {
            'plus': 'bordered-header', 'pro': 'side-accent', 'elite': 'full-gradient',
            'premium': 'two-column', 'advanced': 'minimal-header', 'standard': 'gradient-header',
            'classic': 'bordered-header', 'v1': 'gradient-header', 'v2': 'bordered-header',
            'v3': 'side-accent', 'v4': 'full-gradient', 'v5': 'two-column', 'v6': 'minimal-header',
            'v7': 'split-design', 'v8': 'modern-grid', 'v9': 'timeline-layout', 'v10': 'infographic-style',
            'modern': 'split-design', 'minimal': 'minimal-header', 'creative': 'full-gradient',
            'professional': 'side-accent', 'executive': 'full-gradient',
            'ats-basic': 'ats-standard',
            'ats-professional': 'ats-standard',
            'ats-modern': 'ats-standard',
            'ats-executive': 'ats-standard',
            'ats-tech': 'ats-standard'
        };

        const idLower = templateId.toLowerCase();
        for (const [suffix, layout] of Object.entries(variations)) {
            if (idLower.includes(suffix)) return layout;
        }
        return 'gradient-header'; // Default
    }

    async handleSelfIntro() {
        const introModal = document.querySelector('#introModal');
        const teleContent = document.querySelector('#teleprompterContent');
        const startBtn = document.querySelector('#startTeleprompter');

        // Show modal immediately
        if (introModal) introModal.style.display = 'flex';

        // Initialize Camera
        this.initCamera();

        try {
            if (!this.resumeData || !this.resumeData.personalInfo) {
                alert('Please fill in or generate your resume first.');
                return;
            }

            teleContent.innerHTML = '<div style="padding: 150px 0;"><div class="loading-spinner" style="margin: 0 auto;"></div><br>Generating your personalized script...</div>';

            const data = await api.resume.getSelfIntro(this.resumeData);

            if (data && data.script) {
                // Add padding at bottom so script can scroll all the way up
                teleContent.innerHTML = `
                    <div style="height: 180px;"></div>
                    ${data.script.split('\n').map(line => `<p style="margin: 20px 0;">${line}</p>`).join('')}
                    <div style="height: 250px;"></div>
                `;
            } else {
                throw new Error('Could not generate script');
            }
        } catch (error) {
            console.error('Self Intro Error:', error);
            teleContent.innerHTML = `<div style="padding: 150px 0; color: #ef4444;">Error: ${error.message}</div>`;
        }
    }

    startTeleprompter() {
        const teleContent = document.querySelector('#teleprompterContent');
        const startBtn = document.querySelector('#startTeleprompter');
        const speedInput = document.querySelector('#scrollSpeed');

        if (this.teleprompterInterval) {
            this.stopTeleprompter();
            return;
        }

        startBtn.textContent = 'Pause';
        startBtn.classList.remove('btn-primary');
        startBtn.classList.add('btn-secondary');

        this.teleprompterInterval = setInterval(() => {
            const speed = parseInt(speedInput.value) || 3;
            teleContent.scrollTop += speed / 2;

            // Auto stop if reached end
            if (teleContent.scrollTop + teleContent.clientHeight >= teleContent.scrollHeight - 5) {
                this.stopTeleprompter();
                // Auto-stop recording if active
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.stopRecording();
                }
            }
        }, 30);
    }

    stopTeleprompter() {
        const startBtn = document.querySelector('#startTeleprompter');
        if (this.teleprompterInterval) {
            clearInterval(this.teleprompterInterval);
            this.teleprompterInterval = null;
        }
        if (startBtn) {
            startBtn.textContent = 'Start Practice';
            startBtn.classList.add('btn-primary');
            startBtn.classList.remove('btn-secondary');
        }
    }

    async initCamera() {
        const video = document.querySelector('#cameraPreview');
        if (!video) return;

        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });
            video.srcObject = this.mediaStream;
        } catch (error) {
            console.error('Camera access denied:', error);
            alert('Camera or Microphone access denied. You can still practice without recording.');
        }
    }

    stopCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        const video = document.querySelector('#cameraPreview');
        if (video) video.srcObject = null;
        this.stopRecording(); // Safety
    }

    toggleRecording() {
        const recordBtn = document.querySelector('#recordIntroBtn');
        const status = document.querySelector('#recordingStatus');

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.stopRecording();
            return;
        }

        if (!this.mediaStream) {
            alert('Camera not initialized. Please allow camera access.');
            return;
        }

        const chunks = [];
        this.mediaRecorder = new MediaRecorder(this.mediaStream);

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);

            // Auto-download for now, or could show a preview modal
            const a = document.createElement('a');
            a.href = url;
            a.download = `Self_Intro_${new Date().getTime()}.webm`;
            a.click();

            recordBtn.innerHTML = '<span>🔴 Record intro</span>';
            recordBtn.classList.remove('recording');
            if (status) status.style.display = 'none';
        };

        this.mediaRecorder.start();
        recordBtn.innerHTML = '<span>⏹️ Stop Recording</span>';
        recordBtn.classList.add('recording');
        if (status) status.style.display = 'flex';

        // Auto-start teleprompter when recording starts if not already running
        if (!this.teleprompterInterval) {
            this.startTeleprompter();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
    }

    getTemplateStyles(layoutType) {
        // Dynamic CSS based on layout
        // Using CSS variables to make it themeable

        // Shared resets and base styles
        const base = `
            .resume-template { display: flex; flex-direction: column; min-height: 100%; color: #333; line-height: 1.5; }
            .section-title { margin-bottom: 15px; }
            .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
            .photo-placeholder { background: #e2e8f0; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .photo-placeholder img { width: 100%; height: 100%; object-fit: cover; }
        `;

        const layouts = {
            'gradient-header': `
                ${base}
                .header-section { margin-bottom: 25px; padding: 40px; background: linear-gradient(135deg, var(--primary-light) 0%, rgba(255,255,255,0) 100%); border-bottom: 1px solid #eee; }
                .header-content { display: flex; align-items: center; gap: 20px; }
                .photo-placeholder { width: 110px; height: 110px; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 4px solid white; }
                .name-title { flex: 1; }
                .resume-name { font-size: 38px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 5px; color: #1f2937; }
                .resume-title { font-size: 16px; font-weight: 600; color: var(--primary-color, #6366f1); text-transform: uppercase; letter-spacing: 1px; }
                .contact-bar { padding: 0 40px; display: flex; gap: 20px; flex-wrap: wrap; font-size: 13px; color: #555; margin-bottom: 30px; font-weight: 500; }
                .main-content { padding: 0 40px 40px; }
                .section-title { font-size: 18px; font-weight: 800; color: #111; border-left: 5px solid var(--primary-color, #6366f1); padding-left: 15px; margin: 30px 0 20px; text-transform: uppercase; letter-spacing: 0.5px; }
                .section-item { margin-bottom: 20px; }
                .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 4px; }
                .item-title { font-weight: 700; font-size: 16px; color: #111; }
                .item-subtitle { color: var(--primary-color); font-size: 14px; font-weight: 500; }
                .skill-tag { background: white; border: 1px solid #e5e7eb; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #4b5563; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            `,
            'side-accent': `
                ${base}
                .resume-template { flex-direction: row; }
                .sidebar { width: 34%; background: #1e293b; color: white; padding: 40px 30px; display: flex; flex-direction: column; gap: 30px; text-align: left; }
                .main { flex: 1; padding: 50px 40px; background: white; }
                .photo-placeholder { width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 20px; border: 4px solid rgba(255,255,255,0.2); }
                .contact-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
                .contact-item { font-size: 13px; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
                .sidebar .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: white; border-bottom: 2px solid var(--primary-color); padding-bottom: 8px; margin-bottom: 15px; }
                .sidebar .skill-tag { display: block; margin-bottom: 8px; font-size: 13px; color: #cbd5e1; }
                .resume-name { font-size: 42px; font-weight: 800; line-height: 1; color: #0f172a; margin-bottom: 10px; }
                .resume-title { font-size: 18px; color: var(--primary-color); font-weight: 600; margin-bottom: 30px; }
                .main .section-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 25px; display: flex; align-items: center; gap: 15px; }
                .main .section-title:after { content: ''; flex: 1; height: 2px; background: #f1f5f9; }
                .item-title { font-weight: 700; font-size: 16px; color: #334155; }
                .item-subtitle { font-size: 14px; color: #64748b; margin-bottom: 8px; }
            `,
            'minimal-header': `
                ${base}
                .resume-template { padding: 50px; text-align: center; max-width: 900px; margin: 0 auto; }
                .header-section { margin-bottom: 50px; border-bottom: 1px solid #e2e8f0; padding-bottom: 40px; }
                .photo-placeholder { width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 25px; border: 1px solid #e2e8f0; padding: 4px; background: white; }
                .photo-placeholder img { border-radius: 50%; }
                .resume-name { font-size: 48px; font-weight: 300; letter-spacing: -1px; text-transform: uppercase; color: #111; margin-bottom: 10px; font-family: 'Times New Roman', serif; }
                .resume-title { font-size: 14px; letter-spacing: 4px; color: #666; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; }
                .contact-bar { justify-content: center; display: flex; gap: 20px; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
                .content-grid { text-align: left; }
                .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #111; text-align: center; margin: 40px 0 25px; position: relative; }
                .section-title:before { content: ''; position: absolute; left: 50%; bottom: -10px; width: 40px; height: 2px; background: var(--primary-color); transform: translateX(-50%); }
                .item-header { display: flex; justify-content: space-between; margin-bottom: 5px; align-items: center; }
                .item-title { font-weight: 600; font-size: 16px; color: #333; }
                .item-subtitle { font-size: 13px; color: #666; font-style: italic; }
                .skills-grid { justify-content: center; }
                .skill-tag { border: 1px solid #e5e7eb; padding: 6px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555; transition: border-color 0.2s; }
                .skill-tag:hover { border-color: var(--primary-color); color: var(--primary-color); }
            `,
            'two-column': `
                ${base}
                .resume-template { padding: 0; display: flex; min-height: 100%; }
                .col-left { width: 35%; background: var(--primary-light); padding: 50px 30px; display: flex; flex-direction: column; gap: 30px; border-right: 1px solid rgba(0,0,0,0.05); }
                .col-right { width: 65%; padding: 50px 40px; background: white; }
                .header-section { margin-bottom: 40px; }
                .photo-placeholder { width: 130px; height: 130px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
                .resume-name { font-size: 36px; font-weight: 800; line-height: 1.1; margin-bottom: 10px; color: #111; }
                .resume-title { font-size: 18px; font-weight: 600; color: var(--primary-color); opacity: 0.9; }
                .contact-info div { margin-bottom: 12px; font-size: 13px; color: #444; font-weight: 500; display: flex; align-items: center; gap: 8px; }
                .col-left .section-title { font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; color: #111; letter-spacing: 0.5px; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
                .col-right .section-title { font-size: 20px; font-weight: 800; color: var(--primary-color); margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; border-left: 0; padding-left: 0; }
                .item-title { font-weight: 700; font-size: 16px; margin-bottom: 2px; }
                .item-subtitle { font-size: 14px; color: #666; font-weight: 500; }
                .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
                .skill-tag { background: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #333; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            `,
            'modern-grid': `
                ${base}
                .resume-template { padding: 40px; }
                .header-section { background: #111827; color: white; padding: 40px; border-radius: 16px; display: flex; gap: 30px; align-items: center; margin-bottom: 30px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
                .header-section .resume-title { color: var(--primary-color); font-weight: 600; letter-spacing: 0.5px; }
                .header-section .contact-item { color: #9ca3af; font-size: 13px; }
                .photo-placeholder { width: 100px; height: 100px; border-radius: 12px; background: #374151; }
                .grid-container { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
                .card-section { background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 20px; transition: box-shadow 0.2s; }
                .card-section:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
                .section-title:before { content: ''; width: 8px; height: 8px; background: var(--primary-color); border-radius: 2px; }
                .item-title { font-weight: 700; font-size: 15px; color: #1e293b; }
                .item-subtitle { font-size: 13px; color: #64748b; }
                .skill-tag { background: var(--primary-light); color: var(--primary-color); font-weight: 600; padding: 5px 10px; border-radius: 6px; font-size: 12px; }
            `,
            'ats-standard': `
                ${base}
                .resume-template { padding: 30px 45px; font-family: 'Arial', 'Helvetica', sans-serif; color: #000; line-height: 1.4; }
                .header-section { text-align: center; margin-bottom: 25px; border-bottom: none; page-break-after: avoid; break-after: avoid; }
                .resume-name { font-size: 26px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px; color: #000; }
                .contact-bar { justify-content: center; font-size: 13px; margin-bottom: 0; display: block; color: #333; }
                .contact-line { margin-bottom: 3px; }
                .section-title { 
                    font-size: 16px; 
                    font-weight: 800; 
                    text-transform: uppercase; 
                    border-bottom: 1.5px solid #000; 
                    padding-bottom: 3px;
                    margin-top: 22px; 
                    margin-bottom: 12px; 
                    letter-spacing: 1.5px;
                    color: #000;
                    page-break-after: avoid;
                    break-after: avoid;
                }
                .resume-section { page-break-inside: auto; break-inside: auto; margin-bottom: 20px; }
                .section-item { 
                    margin-bottom: 15px; 
                    page-break-inside: avoid; 
                    break-inside: avoid;
                }
                .item-header { display: flex; justify-content: space-between; align-items: baseline; font-weight: 700; margin-bottom: 2px; }
                .item-title { font-size: 14px; text-transform: uppercase; }
                .item-date { font-size: 13px; font-weight: 700; color: #000; }
                .item-subtitle-row { display: flex; justify-content: space-between; font-style: italic; font-size: 13.5px; margin-bottom: 4px; font-weight: 600; }
                .item-description { font-size: 13px; line-height: 1.5; margin-top: 6px; text-align: justify; }
                .description-list { margin-top: 5px; margin-left: 20px; list-style-type: disc; }
                .description-list li { margin-bottom: 3px; }
                .skills-grid { display: block; line-height: 1.6; }
                .skill-tag { 
                    display: inline; 
                    background: transparent; 
                    color: #000; 
                    padding: 0; 
                    border-radius: 0; 
                    font-size: 13px; 
                }
                .skill-tag:after { content: ", "; }
                .skill-tag:last-child:after { content: ""; }
                .declaration-section { margin-top: 35px; font-size: 13px; }
                .add-item-btn-container { margin-top: 10px; }
            `
        };

        return layouts[layoutType] || layouts['gradient-header'];
    }

    // --- RENDERERS ---

    renderGradientHeader(data) {
        return `
            <div class="header-section">
                <div class="header-content">
                    ${!data.personalInfo.photo || this.selectedTemplate.includes('ats-') ? '' : `
                    <div class="photo-placeholder" id="photoPlaceholder">
                        <img src="${data.personalInfo.photo}">
                    </div>`}
                    <div class="name-title">
                        <div class="resume-name" contenteditable="true" data-field="personalInfo.name">${data.personalInfo.name}</div>
                        <div class="resume-title" contenteditable="true" data-field="personalInfo.title">${data.personalInfo.title}</div>
                    </div>
                </div>
                <div class="contact-bar">
                    <span contenteditable="true" data-field="personalInfo.email">📧 ${data.personalInfo.email}</span>
                    <span contenteditable="true" data-field="personalInfo.phone">📱 ${data.personalInfo.phone}</span>
                    <span contenteditable="true" data-field="personalInfo.location">📍 ${data.personalInfo.location}</span>
                </div>
            </div>
            <div class="main-content">
                ${data.summary ? `
                    <div class="resume-section">
                        <div class="section-title">Summary</div>
                        <div class="item-description" contenteditable="true" data-field="summary">${data.summary}</div>
                    </div>` : ''}
                
                ${data.sections.map(sectionId => {
            if (sectionId === 'experience') return this.renderStandardSection(data, 'experience', 'Experience');
            if (sectionId === 'education') return this.renderStandardSection(data, 'education', 'Education');
            if (sectionId === 'projects') return this.renderStandardSection(data, 'projects', 'Projects');
            if (sectionId === 'certifications') return this.renderStandardSection(data, 'certifications', 'Certifications');
            if (sectionId === 'achievements') return this.renderStandardSection(data, 'achievements', 'Achievements');
            if (sectionId === 'skills') {
                return `
                            <div class="resume-section">
                                <div class="section-title">Skills</div>
                                <div class="skills-grid">
                                    ${data.skills.map((s, i) => `<span class="skill-tag" contenteditable="true" data-field="skills.${i}">${s}</span>`).join('')}
                                </div>
                            </div>`;
            }
            return '';
        }).join('')}
            </div>
        `;
    }

    renderSideAccent(data) {
        return `
            <aside class="sidebar">
                ${!data.personalInfo.photo || this.selectedTemplate.includes('ats-') ? '' : `
                <div class="photo-section">
                    <div class="photo-placeholder" id="photoPlaceholder">
                        <img src="${data.personalInfo.photo}">
                    </div>
                </div>`}
                
                <div class="contact-section">
                    <div class="section-title">Contact</div>
                    <div class="contact-list">
                        <div class="contact-item" contenteditable="true" data-field="personalInfo.email">📧 ${data.personalInfo.email}</div>
                        <div class="contact-item" contenteditable="true" data-field="personalInfo.phone">📱 ${data.personalInfo.phone}</div>
                        <div class="contact-item" contenteditable="true" data-field="personalInfo.location">📍 ${data.personalInfo.location}</div>
                        <div class="contact-item" contenteditable="true" data-field="personalInfo.linkedin">🔗 ${data.personalInfo.linkedin}</div>
                    </div>
                </div>

                ${data.sections.includes('skills') ? `
                <div class="skills-section">
                    <div class="section-title">Skills</div>
                    ${data.skills.map((s, i) => `<span class="skill-tag" contenteditable="true" data-field="skills.${i}">${s}</span>`).join('')}
                </div>` : ''}
            </aside>
            <main class="main">
                <div class="header">
                    <div class="resume-name" contenteditable="true" data-field="personalInfo.name">${data.personalInfo.name}</div>
                    <div class="resume-title" contenteditable="true" data-field="personalInfo.title">${data.personalInfo.title}</div>
                </div>
                
                <div class="resume-section">
                    <div class="section-title">Professional Profile</div>
                    <div class="item-description" contenteditable="true" data-field="summary">${this.formatDescription(data.summary || '')}</div>
                </div>

                ${data.sections.filter(s => s !== 'skills').map(sectionId => {
            if (sectionId === 'experience') return this.renderStandardSection(data, 'experience', 'Experience');
            if (sectionId === 'education') return this.renderStandardSection(data, 'education', 'Education');
            if (sectionId === 'projects') return this.renderStandardSection(data, 'projects', 'Projects');
            if (sectionId === 'certifications') return this.renderStandardSection(data, 'certifications', 'Certifications');
            if (sectionId === 'achievements') return this.renderStandardSection(data, 'achievements', 'Achievements');
            return '';
        }).join('')}
            </main>
        `;
    }

    renderTwoColumn(data) {
        return `
            <div class="header-section">
                <div class="name-box">
                    <div class="resume-name" contenteditable="true" data-field="personalInfo.name">${data.personalInfo.name}</div>
                    <div class="resume-title" contenteditable="true" data-field="personalInfo.title">${data.personalInfo.title}</div>
                </div>
                 ${!data.personalInfo.photo || this.selectedTemplate.includes('ats-') ? '' : `
                 <div class="photo-placeholder" id="photoPlaceholder">
                    <img src="${data.personalInfo.photo}">
                </div>`}
            </div>
            <div class="col-left">
                <div class="contact-info" style="margin-bottom: 30px;">
                    <div contenteditable="true" data-field="personalInfo.email">${data.personalInfo.email}</div>
                    <div contenteditable="true" data-field="personalInfo.phone">${data.personalInfo.phone}</div>
                    <div contenteditable="true" data-field="personalInfo.location">${data.personalInfo.location}</div>
                </div>
                 ${data.sections.includes('skills') ? `
                    <div class="resume-section">
                        <div class="section-title">Expertise</div>
                        <div class="skills-list">
                            ${data.skills.map((s, i) => `<div class="skill-tag" contenteditable="true" data-field="skills.${i}">${s}</div>`).join('')}
                        </div>
                    </div>` : ''}
                
                ${this.renderStandardSection(data, 'education', 'Education')}
            </div>
            <div class="col-right">
                <div class="resume-section">
                    <div class="section-title">About Me</div>
                    <div class="item-description" contenteditable="true" data-field="summary">${this.formatDescription(data.summary || '')}</div>
                </div>
                ${this.renderStandardSection(data, 'experience', 'Experience')}
            </div>
        `;
    }

    renderMinimalHeader(data) {
        return `
            <div class="header-section">
                 ${!data.personalInfo.photo || this.selectedTemplate.includes('ats-') ? '' : `
                 <div class="photo-placeholder" id="photoPlaceholder">
                    <img src="${data.personalInfo.photo}">
                </div>`}
                <div class="resume-name" contenteditable="true" data-field="personalInfo.name">${data.personalInfo.name}</div>
                <div class="resume-title" contenteditable="true" data-field="personalInfo.title">${data.personalInfo.title}</div>
                <div class="contact-bar">
                    <span contenteditable="true" data-field="personalInfo.email">${data.personalInfo.email}</span>
                    <span contenteditable="true" data-field="personalInfo.phone">${data.personalInfo.phone}</span>
                    <span contenteditable="true" data-field="personalInfo.location">${data.personalInfo.location}</span>
                </div>
            </div>
            <div class="content-grid">
                ${data.summary ? `
                    <div class="resume-section">
                         <div class="section-title">Profile</div>
                        <div class="item-description" style="text-align: center;" contenteditable="true" data-field="summary">${this.formatDescription(data.summary)}</div>
                    </div>` : ''}
                
                ${data.sections.map(sectionId => {
            if (sectionId === 'experience') return this.renderStandardSection(data, 'experience', 'Work History');
            if (sectionId === 'education') return this.renderStandardSection(data, 'education', 'Education');
            if (sectionId === 'projects') return this.renderStandardSection(data, 'projects', 'Projects');
            if (sectionId === 'certifications') return this.renderStandardSection(data, 'certifications', 'Certifications');
            if (sectionId === 'achievements') return this.renderStandardSection(data, 'achievements', 'Achievements');
            if (sectionId === 'skills') {
                return `
                            <div class="resume-section">
                                <div class="section-title">Skills</div>
                                <div class="skills-grid">
                                    ${data.skills.map((s, i) => `<span class="skill-tag" contenteditable="true" data-field="skills.${i}">${s}</span>`).join('')}
                                </div>
                            </div>`;
            }
            return '';
        }).join('')}
            </div>
        `;
    }

    renderATSStandard(data) {
        return `
            <div class="header-section">
                <div class="resume-name" contenteditable="true" data-field="personalInfo.name">${data.personalInfo.name || ''}</div>
                <div class="contact-bar">
                    <div class="contact-line">
                        <span contenteditable="true" data-field="personalInfo.phone">${data.personalInfo.phone || ''}</span> | 
                        <span contenteditable="true" data-field="personalInfo.email">${data.personalInfo.email || ''}</span>
                    </div>
                    <div class="contact-line">
                        <span contenteditable="true" data-field="personalInfo.linkedin">LinkedIn: ${data.personalInfo.linkedin || ''}</span>
                        ${data.personalInfo.location ? ` | <span contenteditable="true" data-field="personalInfo.location">${data.personalInfo.location}</span>` : ''}
                    </div>
                </div>
            </div>
            
            ${data.summary ? `
            <div class="resume-section">
                <div class="section-title">PROFESSIONAL SUMMARY</div>
                <div class="item-description" contenteditable="true" data-field="summary">${this.formatDescription(data.summary)}</div>
            </div>` : ''}

            ${this.renderStandardSection(data, 'education', 'EDUCATION')}
            ${this.renderStandardSection(data, 'experience', 'PROFESSIONAL EXPERIENCE')}
            ${this.renderStandardSection(data, 'projects', 'KEY PROJECTS')}
            ${this.renderStandardSection(data, 'certifications', 'CERTIFICATIONS & ACHIEVEMENTS')}
            
            ${data.skills && data.skills.length > 0 ? `
            <div class="resume-section">
                <div class="section-title">TECHNICAL SKILLS</div>
                <div class="skills-grid">
                    ${data.skills.map((s, i) => `<span class="skill-tag" contenteditable="${!this.isViewMode}" data-field="skills.${i}">${s}</span>`).join('')}
                </div>
            </div>` : ''}

            ${this.renderStandardSection(data, 'languages', 'LANGUAGES')}
            ${this.renderStandardSection(data, 'interests', 'INTERESTS')}
            ${this.renderCustomSections(data)}

            ${data.declaration ? `
                <div class="declaration-section">
                    <div class="section-title">DECLARATION</div>
                    <div class="item-description" contenteditable="true" data-field="declaration">${data.declaration}</div>
                </div>` : ''}
        `;
    }

    renderModernGrid(data) {
        return `
             <div class="header-section">
                ${!data.personalInfo.photo || this.selectedTemplate.includes('ats-') ? '' : `
                <div class="photo-placeholder" id="photoPlaceholder" style="width: 80px; height: 80px; border-radius: 8px;">
                     <img src="${data.personalInfo.photo}">
                </div>`}
                 <div style="flex: 1;">
                    <div class="resume-name" contenteditable="true" data-field="personalInfo.name">${data.personalInfo.name}</div>
                    <div class="resume-title" contenteditable="true" data-field="personalInfo.title">${data.personalInfo.title}</div>
                 </div>
                 <div style="text-align: right; font-size: 13px;">
                    <div contenteditable="true" data-field="personalInfo.email">${data.personalInfo.email}</div>
                     <div contenteditable="true" data-field="personalInfo.phone">${data.personalInfo.phone}</div>
                     <div contenteditable="true" data-field="personalInfo.location">${data.personalInfo.location}</div>
                 </div>
            </div>
            <div class="grid-container">
                <div class="main-col">
                     ${data.sections.filter(s => ['experience', 'projects'].includes(s)).map(s => {
            if (s === 'experience') return this.renderStandardSection(data, 'experience', 'Experience', 'card-section');
            if (s === 'projects') return this.renderStandardSection(data, 'projects', 'Projects', 'card-section');
            return '';
        }).join('')}
                </div>
                <div class="side-col">
                     <div class="card-section">
                        <div class="section-title">Summary</div>
                        <div class="item-description" contenteditable="true" data-field="summary">${data.summary}</div>
                     </div>
                     ${data.sections.filter(s => !['experience', 'projects', 'skills'].includes(s)).map(s => {
            if (s === 'education') return `<div class="card-section">${this.renderStandardSection(data, 'education', 'Education', '')}</div>`;
            if (s === 'certifications') return this.renderStandardSection(data, 'certifications', 'Certifications', 'card-section');
            if (s === 'languages') return this.renderStandardSection(data, 'languages', 'Languages', 'card-section');
            if (s === 'interests') return this.renderStandardSection(data, 'interests', 'Interests', 'card-section');
            if (s === 'achievements') return this.renderStandardSection(data, 'achievements', 'Achievements', 'card-section');
            return '';
        }).join('')}
                     
                      ${data.sections.includes('skills') ? `
                     <div class="card-section">
                        <div class="section-title">Skills</div>
                        <div class="skills-grid">
                            ${data.skills.map((s, i) => `<span class="skill-tag" contenteditable="true" data-field="skills.${i}">${s}</span>`).join('')}
                        </div>
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    // Fallback/Placeholder for other complex layouts
    renderSplitDesign(data) { return this.renderSideAccent(data); } // Similar structure
    renderTimelineLayout(data) { return this.renderMinimalHeader(data); }
    renderInfographicStyle(data) { return this.renderModernGrid(data); }
    renderFullGradient(data) { return this.renderGradientHeader(data); }
    renderBorderedHeader(data) { return this.renderGradientHeader(data); }

    formatDescription(text) {
        if (!text) return '';

        // Clean up input
        let content = Array.isArray(text) ? text.join('\n') : String(text);

        // Pre-process: If it's a paragraph with embedded numbers (e.g. "1. Abc 2. Def"), split them
        // This handles cases where numbers are not on new lines
        if (!content.includes('\n') && /\d+[\.\)]\s+/.test(content)) {
            content = content.replace(/(\s+)(\d+[\.\)])/g, '\n$2');
        }

        // Split into points (handles existing bullets, dashes, or just newlines)
        const points = content
            .split('\n')
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => p.replace(/^[•\-\*]\s*/, '').replace(/^\d+[\.\)]\s*/, '')); // Remove existing symbols and numbers

        if (points.length > 0) {
            return `<ul class="description-list">${points.map(p => `<li>${p}</li>`).join('')}</ul>`;
        }

        return content;
    }

    renderStandardSection(data, sectionKey, title, wrapperClass = 'resume-section') {
        const items = data[sectionKey];
        if (!items || items.length === 0) return '';

        const isATS = this.selectedTemplate.toLowerCase().includes('ats-');

        return `
            <div class="${wrapperClass}">
                <div class="section-title">${title}</div>
                ${items.map(item => `
                    <div class="section-item">
                        <div class="item-header">
                            <span class="item-title" contenteditable="${!this.isViewMode}" data-field="${sectionKey}.${item.id}.${sectionKey === 'education' ? 'degree' : 'title'}">
                                ${sectionKey === 'education' ? (item.degree || '') : (item.title || '')}
                            </span>
                            <span class="${isATS ? 'item-date' : 'item-subtitle'}" contenteditable="${!this.isViewMode}" data-field="${sectionKey}.${item.id}.date">
                                ${(item.startDate || '')} ${item.endDate ? '- ' + item.endDate : ''}
                            </span>
                        </div>
                        <div class="${isATS ? 'item-subtitle-row' : 'item-subtitle'}" contenteditable="${!this.isViewMode}" data-field="${sectionKey}.${item.id}.${sectionKey === 'education' ? 'school' : 'company'}">
                            <span>${sectionKey === 'education' ? (item.school || '') : (item.company || '')}</span>
                            ${item.location && !isATS ? `<span>| ${item.location}</span>` : (item.location ? `<span>${item.location}</span>` : '')}
                        </div>
                        ${item.description ? `<div class="item-description" contenteditable="${!this.isViewMode}" data-field="${sectionKey}.${item.id}.description">${this.formatDescription(item.description)}</div>` : ''}
                    </div>
                `).join('')}
                ${!this.isViewMode ? `
                <div class="add-item-btn-container">
                    <button class="add-item-btn" data-section="${sectionKey}">+ Add Item</button>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderCustomSections(data) {
        if (!data.customSections || data.customSections.length === 0) return '';

        const isATS = this.selectedTemplate.toLowerCase().includes('ats-');

        return data.customSections.map((section, sIndex) => `
            <div class="resume-section">
                <div class="section-title" contenteditable="${!this.isViewMode}" data-field="customSections.${sIndex}.title">${section.title}</div>
                ${section.items.map((item, i) => {
            const isJustNumber = /^\d+$/.test(String(item.title).trim());
            const showTitle = !isATS || !isJustNumber;
            const hasSubtitle = !!item.subtitle;
            const showHeader = showTitle || hasSubtitle;

            return `
                    <div class="section-item">
                        ${showHeader ? `
                        <div class="item-header">
                            <span class="item-title" contenteditable="${!this.isViewMode}" data-field="customSections.${sIndex}.items.${i}.title">
                                ${showTitle ? item.title : ''}
                            </span>
                            ${item.subtitle ? `
                            <span class="${isATS ? 'item-date' : 'item-subtitle'}" contenteditable="${!this.isViewMode}" data-field="customSections.${sIndex}.items.${i}.subtitle">
                                ${item.subtitle}
                            </span>` : ''}
                        </div>` : ''}
                        ${item.description ? `<div class="item-description" contenteditable="${!this.isViewMode}" data-field="customSections.${sIndex}.items.${i}.description">${this.formatDescription(item.description)}</div>` : ''}
                    </div>
                `}).join('')}
                ${!this.isViewMode ? `
                <div class="add-item-btn-container">
                    <button class="add-item-btn" data-custom-id="${section.id}">+ Add Item</button>
                </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderAddSectionButton() {
        if (this.isViewMode) return '';
        return `
            <div class="add-section-container" style="text-align: center; margin-top: 30px; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s;" id="addCustomSectionBtnGlobal">
                <div style="font-size: 24px; color: var(--primary-color); margin-bottom: 8px;">+</div>
                <div style="font-weight: 600; color: #4b5563;">Add New Section</div>
                <div style="font-size: 13px; color: #9ca3af;">Create a custom section for anything you need</div>
            </div>
        `;
    }



    renderSectionToggle(sectionId, label) {
        const isChecked = this.resumeData.sections.includes(sectionId);
        return `
            <div class="section-toggle-item">
                <div style="flex: 1;">
                    <input type="checkbox" id="toggle-${sectionId}" 
                        ${isChecked ? 'checked' : ''}
                        data-section="${sectionId}">
                    <label for="toggle-${sectionId}">${label}</label>
                </div>
            </div>
        `;
    }

    toggleSection(sectionId, isVisible) {
        if (isVisible) {
            if (!this.resumeData.sections.includes(sectionId)) {
                this.resumeData.sections.push(sectionId);
            }
        } else {
            this.resumeData.sections = this.resumeData.sections.filter(id => id !== sectionId);
        }
        this.saveResumeData();
        // Re-render
        this.element.innerHTML = this.render().innerHTML;
        this.attachEventListeners();

        // Restore active tab
        const sectionsTab = this.element.querySelector('[data-tab="sections"]');
        if (sectionsTab) {
            const tabName = 'sections';
            this.element.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
            sectionsTab.classList.add('active');

            this.element.querySelectorAll('.tab-content').forEach(content => {
                if (content.getAttribute('data-content') === tabName) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
        }
    }

    addCustomSection() {
        const id = 'custom-' + Date.now();
        const title = 'New Section';

        this.resumeData.customSections.push({
            id: id,
            title: title,
            items: [{
                id: Date.now(),
                title: 'Item Title',
                subtitle: 'Subtitle / Date',
                description: 'Description'
            }]
        });

        // Auto-enable
        this.resumeData.sections.push(id);

        this.saveResumeData();
        this.element.innerHTML = this.render().innerHTML;
        this.attachEventListeners();

        // Switch to sections tab
        const sectionsTab = this.element.querySelector('[data-tab="sections"]');
        if (sectionsTab) sectionsTab.click();
    }

    deleteCustomSection(sectionId) {
        if (confirm('Are you sure you want to delete this section?')) {
            this.resumeData.customSections = this.resumeData.customSections.filter(s => s.id !== sectionId);
            this.resumeData.sections = this.resumeData.sections.filter(id => id !== sectionId);

            this.saveResumeData();
            this.element.innerHTML = this.render().innerHTML;
            this.attachEventListeners();

            // Switch to sections tab
            const sectionsTab = this.element.querySelector('[data-tab="sections"]');
            if (sectionsTab) sectionsTab.click();
        }
    }

    // Updated attachEventListeners to include new toggles
    attachEventListeners() {
        // Back button
        const backBtn = this.element.querySelector('#backBtn');
        backBtn?.addEventListener('click', () => {
            localStorage.removeItem('resumeViewMode');
            const templatesLink = document.querySelector('[data-page="templates"]');
            templatesLink?.click();
        });

        // Edit Mode Toggle (Success Banner)
        const editModeBtn = this.element.querySelector('#editModeBtn');
        editModeBtn?.addEventListener('click', () => {
            this.isViewMode = false;
            localStorage.removeItem('resumeViewMode');
            this.element.classList.remove('view-mode');
            const banner = this.element.querySelector('.conversion-success-banner');
            if (banner) banner.style.display = 'none';
        });

        // Zoom controls
        const zoomIn = this.element.querySelector('#zoomIn');
        const zoomOut = this.element.querySelector('#zoomOut');
        const zoomLevel = this.element.querySelector('#zoomLevel');
        const canvas = this.element.querySelector('#resumeCanvas');

        zoomIn?.addEventListener('click', () => {
            this.zoomLevel = Math.min(150, this.zoomLevel + 25);
            canvas.style.transform = `scale(${this.zoomLevel / 100})`;
            zoomLevel.textContent = `${this.zoomLevel}%`;
        });

        zoomOut?.addEventListener('click', () => {
            this.zoomLevel = Math.max(50, this.zoomLevel - 25);
            canvas.style.transform = `scale(${this.zoomLevel / 100})`;
            zoomLevel.textContent = `${this.zoomLevel}%`;
        });

        // Download PDF
        const downloadBtn = this.element.querySelector('#downloadBtn');
        downloadBtn?.addEventListener('click', () => {
            window.print();
        });

        // Edit Resume
        const editResumeBtn = this.element.querySelector('#editResumeBtn');
        editResumeBtn?.addEventListener('click', () => {
            localStorage.setItem('resumeViewMode', 'false');
            this.isViewMode = false;
            
            // Re-render the entire editor to restore all editable elements and event listeners
            this.element.innerHTML = this.render().innerHTML;
            this.attachEventListeners();
        });

        // Save Resume Manually
        const saveResumeBtn = this.element.querySelector('#saveResumeBtn');
        saveResumeBtn?.addEventListener('click', () => {
            this.saveResumeData();
            
            // Visual feedback
            const originalText = saveResumeBtn.innerHTML;
            saveResumeBtn.innerHTML = '✅ Saved!';
            saveResumeBtn.style.background = '#10b981';
            saveResumeBtn.style.color = 'white';
            
            setTimeout(() => {
                saveResumeBtn.innerHTML = originalText;
                saveResumeBtn.style.background = 'white';
                saveResumeBtn.style.color = '#10b981';
            }, 2000);
        });

        // Undo/Redo (Placeholders)
        this.element.querySelector('#undoBtn')?.addEventListener('click', () => {
            // TODO: Implement Undo
            alert('Undo functionality coming soon!');
        });
        this.element.querySelector('#redoBtn')?.addEventListener('click', () => {
            // TODO: Implement Redo
            alert('Redo functionality coming soon!');
        });

        // Sidebar tabs
        const tabs = this.element.querySelectorAll('.sidebar-tab');
        const tabContents = this.element.querySelectorAll('.tab-content');



        // AI Feature Listeners
        const aiBtn = this.element.querySelector('#aiGenerateBtn');
        const closeAiBtn = this.element.querySelector('#closeAiModal');
        const generateAiBtn = this.element.querySelector('#generateAiBtn');
        const aiModal = this.element.querySelector('#aiModal');

        if (aiBtn) {
            aiBtn.addEventListener('click', () => {
                aiModal.style.display = 'flex';
            });
        }

        // Auto-open AI Modal if requested from Gallery
        if (localStorage.getItem('openAiModal') === 'true') {
            aiModal.style.display = 'flex';
            localStorage.removeItem('openAiModal'); // Clear flag
        }

        if (closeAiBtn) {
            closeAiBtn.addEventListener('click', () => {
                aiModal.style.display = 'none';
            });
        }

        // Close on outside click
        if (aiModal) {
            aiModal.addEventListener('click', (e) => {
                if (e.target === aiModal) aiModal.style.display = 'none';
            });
        }

        if (generateAiBtn) {
            generateAiBtn.addEventListener('click', () => this.handleAIGeneration());
        }

        // Self Intro Feature Listeners
        const selfIntroBtn = this.element.querySelector('#selfIntroBtn');
        const introModal = this.element.querySelector('#introModal');
        const closeIntroBtn = this.element.querySelector('#closeIntroModal');
        const startTeleBtn = this.element.querySelector('#startTeleprompter');
        const resetTeleBtn = this.element.querySelector('#resetTeleprompter');
        const teleContent = this.element.querySelector('#teleprompterContent');

        if (selfIntroBtn) {
            selfIntroBtn.addEventListener('click', () => {
                // Close AI modal first if open
                if (aiModal) aiModal.style.display = 'none';
                this.handleSelfIntro();
            });
        }

        if (closeIntroBtn) {
            closeIntroBtn.addEventListener('click', () => {
                this.stopTeleprompter();
                this.stopCamera();
                if (introModal) introModal.style.display = 'none';
            });
        }

        if (introModal) {
            introModal.addEventListener('click', (e) => {
                if (e.target === introModal) {
                    this.stopTeleprompter();
                    this.stopCamera();
                    introModal.style.display = 'none';
                }
            });
        }

        if (startTeleBtn) {
            startTeleBtn.addEventListener('click', () => this.startTeleprompter());
        }

        const recordIntroBtn = this.element.querySelector('#recordIntroBtn');
        if (recordIntroBtn) {
            recordIntroBtn.addEventListener('click', () => this.toggleRecording());
        }

        if (resetTeleBtn) {
            resetTeleBtn.addEventListener('click', () => {
                this.stopTeleprompter();
                if (teleContent) teleContent.scrollTop = 0;
            });
        }


        // AI Modal - Category Change Listener
        const aiCategory = this.element.querySelector('#aiCategory');
        if (aiCategory) {
            aiCategory.addEventListener('change', (e) => {
                const category = e.target.value;
                const expGroup = this.element.querySelector('#aiExperienceGroup');
                const workLabel = this.element.querySelector('#aiWorkHistoryLabel');
                const workTextarea = this.element.querySelector('#aiWorkHistory');
                const projectsLabel = this.element.querySelector('label[for="aiProjects"]') || this.element.querySelector('#aiProjects').previousElementSibling;

                // Reset defaults
                if (expGroup) expGroup.style.display = 'block';
                if (workLabel) workLabel.textContent = 'Detailed Work Experience / Internships';
                if (workTextarea) workTextarea.placeholder = 'List your key roles, companies, and what you did there...';
                if (projectsLabel) projectsLabel.textContent = 'Key Projects';

                if (category === 'Student / Fresher') {
                    if (expGroup) expGroup.style.display = 'none';
                    if (workLabel) workLabel.textContent = 'Internships & Volunteer Work';
                    if (workTextarea) workTextarea.placeholder = 'List your internships, academic projects, or volunteer experience...';
                } else if (category === 'School Teacher') {
                    if (workLabel) workLabel.textContent = 'Teaching Experience (School Name, Subject, Grade Level)';
                    if (workTextarea) workTextarea.placeholder = 'e.g. Maths Teacher at ABC School - Handled 6th-10th grades; 5 years exp...';
                } else if (category === 'University Professor / Lecturer') {
                    if (workLabel) workLabel.textContent = 'Teaching Experience & Research Guidance';
                    if (workTextarea) workTextarea.placeholder = 'e.g. Assistant Professor at XYZ University - Subjects handled, PhD guidance...';
                    if (projectsLabel) projectsLabel.textContent = 'Research & Publications / Funded Projects';
                } else if (category === 'Doctor / Healthcare Professional') {
                    if (workLabel) workLabel.textContent = 'Clinical Experience (Hospital Name, practice type)';
                    if (workTextarea) workTextarea.placeholder = 'e.g. General Physician at City Hospital - Emergency care, patient diagnosis...';
                    if (projectsLabel) projectsLabel.textContent = 'Specialization & Research (if any)';
                }
            });

            // Initial trigger to set correct state
            aiCategory.dispatchEvent(new Event('change'));
        }
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');

                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                tabContents.forEach(content => {
                    if (content.getAttribute('data-content') === tabName) {
                        content.style.display = 'block';
                    } else {
                        content.style.display = 'none';
                    }
                });
            });
        });

        // Section Toggles
        this.element.querySelectorAll('input[type="checkbox"][data-section]').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.toggleSection(e.target.getAttribute('data-section'), e.target.checked);
            });
        });

        // Add Custom Section
        this.element.querySelector('#addCustomSectionBtn')?.addEventListener('click', () => {
            this.addCustomSection();
        });

        // Delete Custom Section
        this.element.querySelectorAll('.delete-section-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteCustomSection(e.target.getAttribute('data-id'));
            });
        });

        // Color themes
        this.renderColorOptions();

        // Font options
        this.renderFontOptions();

        // Photo upload
        const photoPlaceholder = this.element.querySelector('#photoPlaceholder');
        const photoInput = this.element.querySelector('#photoInput');
        const uploadPhotoBtn = this.element.querySelector('#uploadPhotoBtn');

        const removePhotoBtn = this.element.querySelector('#removePhotoBtn');

        photoPlaceholder?.addEventListener('click', () => photoInput?.click());
        uploadPhotoBtn?.addEventListener('click', () => photoInput?.click());

        removePhotoBtn?.addEventListener('click', () => {
            this.resumeData.personalInfo.photo = null;
            this.saveResumeData();
            // Re-render
            this.element.querySelector('#resumeCanvas').innerHTML = this.renderTemplate();
            this.attachDynamicListeners(); // Re-attach listeners for the new DOM
        });

        photoInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.resumeData.personalInfo.photo = event.target.result;
                    this.saveResumeData();
                    // Full re-render to ensure all layouts update
                    this.element.querySelector('#resumeCanvas').innerHTML = this.renderTemplate();
                    this.attachDynamicListeners();
                };
                reader.readAsDataURL(file);
            }
        });

        this.element.querySelector('#linkedinOptimizeBtn')?.addEventListener('click', () => {
            this.handleLinkedInOptimization();
        });

        this.element.querySelector('#coldEmailBtn')?.addEventListener('click', () => {
            this.handleColdEmailGeneration();
        });

        this.element.querySelector('#closeLinkedinModal')?.addEventListener('click', () => {
            document.querySelector('#linkedinModal').style.display = 'none';
        });

        // ATS Heatmap Button
        const atsHeatmapBtn = this.element.querySelector('#atsHeatmapBtn');
        if (atsHeatmapBtn) {
            atsHeatmapBtn.addEventListener('click', () => this.handleATSHeatmap());
        }

        this.attachDynamicListeners();
    }

    attachDynamicListeners() {
        const photoPlaceholder = this.element.querySelector('#resumeCanvas #photoPlaceholder');
        const photoInput = this.element.querySelector('#photoInput');

        if (photoPlaceholder) {
            photoPlaceholder.onclick = () => photoInput?.click();
        }

        const editableFields = this.element.querySelectorAll('[contenteditable="true"]');
        editableFields.forEach(field => {
            field.addEventListener('blur', (e) => {
                const fieldPath = e.target.getAttribute('data-field');
                const value = e.target.textContent;
                this.updateField(fieldPath, value);
            });
        });

        // Add Item Buttons
        this.element.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.getAttribute('data-section');
                const customId = e.target.getAttribute('data-custom-id');

                if (section) {
                    this.addItem(section);
                } else if (customId) {
                    this.addCustomItem(customId);
                }
            });
        });

        // Global Add Section Button
        const globalAddBtn = this.element.querySelector('#addCustomSectionBtnGlobal');
        if (globalAddBtn) {
            globalAddBtn.addEventListener('click', () => {
                this.addCustomSection();
            });
        }
    }

    renderColorOptions() {
        const colorGrid = this.element.querySelector('#colorGrid');
        const colors = {
            // Core Professional (Top Priority)
            navy: '#1e3a8a',
            slate: '#334155',
            charcoal: '#374151',
            midnight: '#2c3e50',
            indigo: '#4338ca',
            graphite: '#1a202c',

            // Executive Blues & Greys
            azure: '#1d4ed8',
            ocean: '#0369a1',
            steel: '#475569',
            cool: '#64748b',

            // Professional Accents
            emerald: '#065f46',
            teal: '#0f766e',
            forest: '#166534',
            burgundy: '#7f1d1d',
            crimson: '#991b1b',
            plum: '#581c87',

            // Subtle Tones
            stone: '#57534e',
            olive: '#3f6212',
            earth: '#7c2d12',
            sepia: '#78350f'
        };

        colorGrid.innerHTML = Object.entries(colors).map(([name, color]) => `
            <div class="color-option ${this.customization.colorScheme === name ? 'active' : ''}" 
                 style="background: ${color};" 
                 data-color="${name}"
                 title="${name}"></div>
        `).join('');

        colorGrid.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const colorName = e.target.getAttribute('data-color');
                this.customization.colorScheme = colorName;
                this.applyColorScheme(colors[colorName]);

                colorGrid.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    renderFontOptions() {
        const fontOptions = this.element.querySelector('#fontOptions');
        const fonts = ['Inter', 'Roboto', 'Outfit', 'Montserrat', 'Lato'];

        fontOptions.innerHTML = fonts.map(font => `
            <div class="font-option ${this.customization.fontFamily === font ? 'active' : ''}" 
                 data-font="${font}" 
                 style="font-family: ${font};">
                ${font}
            </div>
        `).join('');

        fontOptions.querySelectorAll('.font-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const font = e.target.getAttribute('data-font');
                this.customization.fontFamily = font;
                this.applyFont(font);

                fontOptions.querySelectorAll('.font-option').forEach(opt => opt.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    applyColorScheme(color) {
        const canvas = this.element.querySelector('#resumeCanvas');
        // Set CSS variable for the theme color
        canvas.style.setProperty('--primary-color', color);

        // Calculate darker and lighter variants
        const colorObj = this.hexToRgb(color);
        if (colorObj) {
            const { r, g, b } = colorObj;
            canvas.style.setProperty('--primary-light', `rgba(${r}, ${g}, ${b}, 0.1)`);
            canvas.style.setProperty('--primary-dark', `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`);
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    applyFont(font) {
        const canvas = this.element.querySelector('#resumeCanvas');
        canvas.style.fontFamily = font;
    }

    updateField(fieldPath, value) {
        const parts = fieldPath.split('.');
        let obj = this.resumeData;

        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];

            // Handle arrays where next part is an ID
            if (Array.isArray(obj)) {
                const found = obj.find(item => item.id == key);
                if (found) {
                    obj = found;
                    continue;
                }
            }

            if (obj[key] === undefined) {
                obj[key] = {};
            }
            obj = obj[key];
        }

        obj[parts[parts.length - 1]] = value;
        this.saveResumeData();
    }

    showMatchInsights(score, insights) {
        // Remove existing if any
        const existing = document.body.querySelector('.match-insights-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'match-insights-toast';
        toast.innerHTML = `
            <style>
                .match-insights-toast {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                    width: 350px;
                    padding: 20px;
                    z-index: 2000;
                    border-left: 5px solid #6366f1;
                    animation: slideInRightInsights 0.5s ease-out;
                }
                @keyframes slideInRightInsights {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .match-score-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .match-score-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: #f0f7ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    color: #6366f1;
                    font-size: 1.2rem;
                    border: 3px solid #6366f1;
                }
                .match-title {
                    font-weight: 700;
                    color: #1a202c;
                    font-size: 1.1rem;
                }
                .match-insights-list {
                    margin: 0;
                    padding-left: 20px;
                    font-size: 0.9rem;
                    color: #4a5568;
                }
                .match-insights-list li {
                    margin-bottom: 5px;
                }
            </style>
            <div class="match-score-header">
                <div>
                    <div class="match-title">JD Match Score</div>
                    <div style="font-size: 0.8rem; color: #718096;">AI-Powered Analysis</div>
                </div>
                <div class="match-score-circle">${score}%</div>
            </div>
            <ul class="match-insights-list">
                ${insights ? insights.map(i => `<li>${i}</li>`).join('') : '<li>Resume tailored for the specific JD.</li>'}
            </ul>
            <button class="toolbar-btn primary" style="width: 100%; margin-top: 15px;" id="closeInsightsBtn">Awesome!</button>
        `;

        document.body.appendChild(toast);

        toast.querySelector('#closeInsightsBtn').addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        });
    }

    renderAIInsights(data) {
        if (!data.atsScore && (!data.atsFeedback || data.atsFeedback.length === 0)) return '';

        const score = data.atsScore || 0;
        const feedback = data.atsFeedback || [];

        let color = '#ef4444';
        if (score >= 80) color = '#10b981';
        else if (score >= 60) color = '#f59e0b';

        return `
            <div class="ai-insights-container" style="--score-color: ${color}; --score-percent: ${score}%">
                <div class="score-gauge-wrapper">
                    <div class="score-circle">
                        <div class="score-value-container">
                            <div class="score-number">${score}</div>
                            <div class="score-label">ATS SCORE</div>
                        </div>
                    </div>
                </div>
                <div class="insights-content">
                    <div class="insights-header">
                        <span>🎯 AI Smart Review</span>
                    </div>
                    <div class="feedback-list">
                        ${feedback.map(item => `
                            <div class="feedback-item">${item}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    async handleLinkedInOptimization() {
        const linkedinModal = document.querySelector('#linkedinModal');
        const loading = document.querySelector('#linkedinLoading');
        const results = document.querySelector('#linkedinResults');
        const headlineEl = document.querySelector('#linkedinHeadline');
        const aboutEl = document.querySelector('#linkedinAbout');
        const experienceEl = document.querySelector('#linkedinExperience');

        if (!linkedinModal) return;

        linkedinModal.style.display = 'flex';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const data = this.resumeData;
            const response = await api.resume.getLinkedInOptimization(data);

            headlineEl.textContent = response.headline;
            aboutEl.textContent = response.about;

            experienceEl.innerHTML = response.experience.map(exp => `
                <div style="margin-bottom: 20px; background: rgba(59, 130, 246, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <h4 style="color: white; margin: 0; font-size: 1rem;">${exp.title}</h4>
                            <div style="color: #9ca3af; font-size: 13px;">${exp.company}</div>
                        </div>
                        <button class="btn-copy" onclick="this.textContent='Copied!'; const txt=this.parentElement.nextElementSibling.innerText; navigator.clipboard.writeText(txt); setTimeout(()=>this.textContent='Copy', 2000)" style="background: #374151; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">Copy</button>
                    </div>
                    <div style="color: #d1d5db; font-size: 13px; line-height: 1.6;">
                        ${exp.optimizedPoints.map(p => `<div style="margin-bottom: 4px;">• ${p}</div>`).join('')}
                    </div>
                </div>
            `).join('');

            loading.style.display = 'none';
            results.style.display = 'block';

            document.querySelector('#copyLinkedinHeadline').onclick = () => {
                navigator.clipboard.writeText(headlineEl.textContent);
                const btn = document.querySelector('#copyLinkedinHeadline');
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            };

            document.querySelector('#copyLinkedinAbout').onclick = () => {
                navigator.clipboard.writeText(aboutEl.textContent);
                const btn = document.querySelector('#copyLinkedinAbout');
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            };

        } catch (error) {
            console.error('LinkedIn Optimization Error:', error);
            loading.innerHTML = `
                <div style="color: #ef4444; padding: 20px;">
                    <p>Failed to generate optimization: ${error.message}</p>
                    <button class="btn-secondary" onclick="document.querySelector('#linkedinModal').style.display='none'" style="margin-top: 15px;">Close</button>
                </div>`;
        }
    }

    async handleColdEmailGeneration() {
        const modal = document.querySelector('#coldEmailModal');
        const loading = document.querySelector('#coldEmailLoading');
        const results = document.querySelector('#coldEmailResults');
        
        if (!modal) return;
        
        modal.style.display = 'flex';
        loading.style.display = 'block';
        results.style.display = 'none';

        try {
            const data = Object.keys(this.resumeData).length ? this.resumeData : this.loadResumeData();
            const response = await api.resume.getColdEmailTemplates(data);

            // Populate content
            const populateTab = (type, subject, body) => {
                const subjEl = document.querySelector(`#ceSubject${type}`);
                const bodyEl = document.querySelector(`#ceBody${type}`);
                if (subjEl) subjEl.textContent = subject;
                if (bodyEl) bodyEl.textContent = body;
            };

            populateTab('JobApplication', response.jobApplication.subject, response.jobApplication.body);
            populateTab('Networking', response.networking.subject, response.networking.body);
            populateTab('ReferralRequest', response.referralRequest.subject, response.referralRequest.body);

            // Hide loading, show results
            loading.style.display = 'none';
            results.style.display = 'block';

            // Setup listeners for tabs
            const tabs = modal.querySelectorAll('.cold-email-tab');
            const panels = modal.querySelectorAll('.cold-email-panel');
            
            tabs.forEach(tab => {
                tab.onclick = (e) => {
                    const targetTab = e.target.getAttribute('data-tab');
                    tabs.forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    e.target.style.background = '#10b981';
                    e.target.style.color = 'white';
                    
                    tabs.forEach(t => {
                        if (t !== e.target) {
                            t.style.background = '#374151';
                            t.style.color = '#9ca3af';
                        }
                    });

                    panels.forEach(p => {
                        if (p.id === 'tab-' + targetTab) {
                            p.style.display = 'block';
                        } else {
                            p.style.display = 'none';
                        }
                    });
                };
            });

            // Setup listeners for copy buttons
            const copyBtns = modal.querySelectorAll('.btn-copy-email');
            copyBtns.forEach(btn => {
                btn.onclick = (e) => {
                    const targetId = e.target.getAttribute('data-target');
                    const text = document.querySelector('#' + targetId).textContent;
                    navigator.clipboard.writeText(text);
                    const originalText = e.target.textContent;
                    e.target.textContent = 'Copied!';
                    setTimeout(() => e.target.textContent = originalText, 2000);
                };
            });

            // Setup close button
            document.querySelector('#closeColdEmailModal').onclick = () => {
                modal.style.display = 'none';
            };

        } catch (error) {
            console.error('Cold Email Generation Error:', error);
            loading.innerHTML = `
                <div style="color: #ef4444; padding: 20px;">
                    <p>Failed to generate templates: ${error.message}</p>
                    <button class="btn-secondary" onclick="document.querySelector('#coldEmailModal').style.display='none'" style="margin-top: 15px;">Close</button>
                </div>`;
        }
    }

    async handleATSHeatmap() {
        const heatmapBtn = this.element.querySelector('#atsHeatmapBtn');
        const canvas = this.element.querySelector('#resumeCanvas');
        const isCurrentlyActive = canvas.classList.contains('ats-heatmap-active');

        if (isCurrentlyActive) {
            // Clear heatmap
            canvas.classList.remove('ats-heatmap-active');
            this.element.querySelectorAll('.ats-good, .ats-bad, .ats-tooltip').forEach(el => {
                if (el.classList.contains('ats-tooltip')) {
                    el.remove();
                } else {
                    el.classList.remove('ats-good', 'ats-bad');
                }
            });
            heatmapBtn.innerHTML = '🔍 Scan ATS Heatmap';
            heatmapBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            return;
        }

        const originalText = heatmapBtn.innerHTML;
        heatmapBtn.innerHTML = '<div class="loading-spinner" style="display:inline-block; vertical-align:middle; width:12px; height:12px; margin-right:5px;"></div> Scanning...';
        heatmapBtn.disabled = true;

        try {
            // Get current resume text
            const resumeData = this.resumeData;
            
            // Check if there is enough data
            if (!resumeData.experience || resumeData.experience.length === 0) {
                alert("Please add some experience or generate a resume first before scanning.");
                heatmapBtn.innerHTML = originalText;
                heatmapBtn.disabled = false;
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) throw new Error('Please login to use this feature');

            const analysis = await api.resume.getATSHeatmap(resumeData);

            // Apply specific highlights based on layout
            canvas.classList.add('ats-heatmap-active');

            // Find sections in the DOM and apply classes
            const applyHeatmap = (sectionName, dataKey) => {
                // Try to find the title element first
                const titles = Array.from(canvas.querySelectorAll('.section-title'));
                const sectionTitle = titles.find(t => t.textContent.toLowerCase().includes(sectionName.toLowerCase()));
                
                if (sectionTitle && analysis[dataKey]) {
                    // The actual section is usually the parent of the title
                    let sectionDiv = sectionTitle.closest('.resume-section') || sectionTitle.parentElement;
                    
                    if (sectionDiv) {
                        const isGood = analysis[dataKey].status === 'good';
                        sectionDiv.classList.add(isGood ? 'ats-good' : 'ats-bad');
                        
                        // Add tooltip string dynamically
                        const tooltip = document.createElement('div');
                        tooltip.className = 'ats-tooltip';
                        tooltip.innerHTML = `${isGood ? '✅' : '⚠️'} Score: ${analysis[dataKey].score}/10 - ${analysis[dataKey].feedback}`;
                        sectionDiv.appendChild(tooltip);
                    }
                }
            };

            applyHeatmap('summary', 'summary');
            applyHeatmap('profile', 'summary'); // Alternate name
            applyHeatmap('about', 'summary'); // Alternate name
            applyHeatmap('experience', 'experience');
            applyHeatmap('work history', 'experience'); // Alternate name
            applyHeatmap('education', 'education');
            applyHeatmap('skills', 'skills');
            applyHeatmap('expertise', 'skills'); // Alternate name

            heatmapBtn.innerHTML = '❌ Clear Heatmap';
            heatmapBtn.style.background = '#6b7280'; // Gray out when active

        } catch (error) {
            console.error('Heatmap error:', error);
            alert('Error running ATS Heatmap: ' + error.message);
            heatmapBtn.innerHTML = originalText;
        } finally {
            heatmapBtn.disabled = false;
        }
    }
}
