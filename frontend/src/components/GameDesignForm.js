// frontend/src/components/GameDesignForm.js - ENHANCED VERSION
import React, { useState } from 'react';
import '../styles/GameDesignForm.css';

function GameDesignForm({ onSuccess, onError }) {
  const [formData, setFormData] = useState({
    project_name: '',
    genre: 'RTS',
    match_duration: '15-20 minutes',
    skill_ceiling: 'high',
    audience: 'competitive gamers',
    platform: 'PC/Mobile',
    version: '1.0.0',
    tenant_id: 'default-tenant',
    constraints: {
      notes: '',
      ui_quality: 'premium',  // NEW: UI quality preference
      art_style: 'modern',    // NEW: Art style preference
      color_scheme: 'vibrant' // NEW: Color scheme
    }
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (['notes', 'ui_quality', 'art_style', 'color_scheme'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        constraints: {
          ...prev.constraints,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type - EXPANDED SUPPORT
    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['txt', 'pdf', 'pptx', 'ppt', 'docx', 'doc'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Please upload a .txt, .pdf, .pptx, or .docx file');
      e.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    setProgress('Processing file...');
    setUploadProgress(0);

    try {
      // Convert file to base64
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentLoaded = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentLoaded);
        }
      };

      reader.onload = async () => {
        const base64Content = reader.result.split(',')[1];
        
        // For text files, also show preview
        if (file.type === 'text/plain') {
          const textContent = atob(base64Content);
          setFilePreview(textContent.substring(0, 500) + (textContent.length > 500 ? '...' : ''));
        } else {
          setFilePreview(`${file.type.split('/')[1].toUpperCase()} document - ${(file.size / 1024).toFixed(2)} KB`);
        }
        
        setUploadedFile({
          name: file.name,
          type: file.type || `application/${fileExtension}`,
          size: file.size,
          content: base64Content
        });
        
        setProgress(`✅ File "${file.name}" ready to upload`);
        setUploadProgress(100);
        
        console.log('File processed successfully');
      };

      reader.onerror = () => {
        alert('Error reading file. Please try again.');
        setProgress('');
        setUploadProgress(0);
        e.target.value = '';
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('File processing error:', error);
      alert('Error processing file: ' + error.message);
      setProgress('');
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setProgress('🚀 Initializing workflow...');

    try {
      // Prepare the payload with enhanced UI requirements
      const payload = {
        ...formData,
        constraints: {
          ...formData.constraints,
          // Add explicit UI quality requirements
          ui_requirements: {
            quality: formData.constraints.ui_quality,
            art_style: formData.constraints.art_style,
            color_scheme: formData.constraints.color_scheme,
            responsive: true,
            animations: true,
            professional: true
          }
        }
      };

      // Add uploaded file if present
      if (uploadedFile) {
        payload.uploaded_file = uploadedFile;
        setProgress('📎 Uploading file and sending to workflow...');
      } else {
        setProgress('📤 Sending to n8n workflow...');
      }

      console.log('Submitting payload:', {
        ...payload,
        uploaded_file: uploadedFile ? { ...uploadedFile, content: '[BASE64 DATA]' } : null
      });

      // Get webhook URL from environment
      const n8nWebhookUrl = process.env.REACT_APP_N8N_WEBHOOK_URL || 
        'http://localhost:5678/webhook/gamedesign-pipeline/start';

      console.log('Webhook URL:', n8nWebhookUrl);

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Workflow failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      setProgress('✅ Design generated successfully!');
      
      console.log('n8n workflow result:', result);

      // Show success message
      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form after short delay
      setTimeout(() => {
        setFormData({
          project_name: '',
          genre: 'RTS',
          match_duration: '15-20 minutes',
          skill_ceiling: 'high',
          audience: 'competitive gamers',
          platform: 'PC/Mobile',
          version: '1.0.0',
          tenant_id: 'default-tenant',
          constraints: { 
            notes: '',
            ui_quality: 'premium',
            art_style: 'modern',
            color_scheme: 'vibrant'
          }
        });
        setUploadedFile(null);
        setFilePreview('');
        setProgress('');
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      setProgress('');
      if (onError) {
        onError(error.message);
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview('');
    setProgress('');
    setUploadProgress(0);
    // Reset file input
    const fileInput = document.getElementById('file');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="game-design-form">
      <div className="form-header">
        <h2>🎮 Create New Game Design</h2>
        <p>Generate a complete game design document using AI</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="project_name">
              Project Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="project_name"
              name="project_name"
              value={formData.project_name}
              onChange={handleChange}
              placeholder="e.g., Cyber Clash, Space Warriors, Quantum Realm"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
              >
                <option value="RTS">Real-Time Strategy (RTS)</option>
                <option value="Turn-based Strategy">Turn-based Strategy</option>
                <option value="4X Strategy">4X Strategy</option>
                <option value="MOBA">MOBA</option>
                <option value="Tower Defense">Tower Defense</option>
                <option value="Auto-battler">Auto-battler</option>
                <option value="Card Battler">Card Battler</option>
                <option value="RPG Strategy">RPG Strategy</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="platform">Platform</label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
              >
                <option value="PC/Mobile">PC/Mobile</option>
                <option value="PC">PC Only</option>
                <option value="Mobile">Mobile Only</option>
                <option value="Console">Console</option>
                <option value="Web Browser">Web Browser</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="match_duration">Match Duration</label>
              <select
                id="match_duration"
                name="match_duration"
                value={formData.match_duration}
                onChange={handleChange}
              >
                <option value="5-10 minutes">5-10 minutes (Quick)</option>
                <option value="10-15 minutes">10-15 minutes (Short)</option>
                <option value="15-20 minutes">15-20 minutes (Medium)</option>
                <option value="20-30 minutes">20-30 minutes (Standard)</option>
                <option value="30-45 minutes">30-45 minutes (Long)</option>
                <option value="45+ minutes">45+ minutes (Epic)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="skill_ceiling">Skill Ceiling</label>
              <select
                id="skill_ceiling"
                name="skill_ceiling"
                value={formData.skill_ceiling}
                onChange={handleChange}
              >
                <option value="low">Low (Casual)</option>
                <option value="medium">Medium (Intermediate)</option>
                <option value="high">High (Competitive)</option>
                <option value="very high">Very High (Esports)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="audience">Target Audience</label>
            <select
              id="audience"
              name="audience"
              value={formData.audience}
              onChange={handleChange}
            >
              <option value="casual gamers">Casual Gamers</option>
              <option value="competitive gamers">Competitive Gamers</option>
              <option value="strategy enthusiasts">Strategy Enthusiasts</option>
              <option value="mobile gamers">Mobile Gamers</option>
              <option value="hardcore gamers">Hardcore Gamers</option>
              <option value="family audience">Family Audience</option>
            </select>
          </div>
        </div>

        {/* NEW: UI Quality Section */}
        <div className="form-section ui-quality-section">
          <h3>🎨 UI Quality & Style</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ui_quality">UI Quality Level</label>
              <select
                id="ui_quality"
                name="ui_quality"
                value={formData.constraints.ui_quality}
                onChange={handleChange}
              >
                <option value="premium">Premium (AAA Quality)</option>
                <option value="high">High (Professional)</option>
                <option value="standard">Standard (Clean & Polished)</option>
              </select>
              <small>Higher quality means more detailed graphics and animations</small>
            </div>

            <div className="form-group">
              <label htmlFor="art_style">Art Style</label>
              <select
                id="art_style"
                name="art_style"
                value={formData.constraints.art_style}
                onChange={handleChange}
              >
                <option value="modern">Modern (Sleek & Minimal)</option>
                <option value="futuristic">Futuristic (Sci-Fi)</option>
                <option value="fantasy">Fantasy (Medieval)</option>
                <option value="cyberpunk">Cyberpunk (Neon)</option>
                <option value="retro">Retro (Pixel Art)</option>
                <option value="realistic">Realistic (3D)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="color_scheme">Color Scheme</label>
            <select
              id="color_scheme"
              name="color_scheme"
              value={formData.constraints.color_scheme}
              onChange={handleChange}
            >
              <option value="vibrant">Vibrant (Bold & Colorful)</option>
              <option value="dark">Dark Mode (Dark Theme)</option>
              <option value="light">Light Mode (Bright Theme)</option>
              <option value="neon">Neon (Glowing Colors)</option>
              <option value="pastel">Pastel (Soft Colors)</option>
              <option value="monochrome">Monochrome (Black & White)</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Details (Optional)</h3>
          
          <div className="form-group">
            <label htmlFor="notes">
              Design Notes & Requirements
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.constraints.notes}
              onChange={handleChange}
              placeholder="Describe your vision, special mechanics, themes, or specific requirements...

Examples:
- Focus on fast-paced action with strategic depth
- Include unique faction abilities inspired by nature
- Sci-fi theme with quantum mechanics
- Multiplayer co-op gameplay"
              rows="6"
            />
            <small>
              Provide any additional context that will help create a better design
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="file">
              Upload Design Document
            </label>
            <div className="file-upload-area">
              <input
                type="file"
                id="file"
                accept=".txt,.pdf,.pptx,.ppt,.docx,.doc"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <label htmlFor="file" className="file-upload-label">
                {uploadedFile ? (
                  <div className="file-uploaded">
                    <div className="file-info">
                      <span className="file-icon">📄</span>
                      <div className="file-details">
                        <strong>{uploadedFile.name}</strong>
                        <small>{(uploadedFile.size / 1024).toFixed(2)} KB</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="remove-file"
                      disabled={isSubmitting}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div className="file-upload-placeholder">
                    <span className="upload-icon">📎</span>
                    <span className="upload-text">Click to upload document</span>
                    <small>Supports: .txt, .pdf, .pptx, .docx (max 10MB)</small>
                  </div>
                )}
              </label>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <span className="upload-progress-text">{uploadProgress}%</span>
                </div>
              )}
              
              {filePreview && (
                <div className="file-preview">
                  <strong>Preview:</strong>
                  <pre>{filePreview}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {progress && (
          <div className={`progress-message ${isSubmitting ? 'submitting' : 'success'}`}>
            <span className="progress-icon">
              {isSubmitting ? '⏳' : '✅'}
            </span>
            {progress}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || !formData.project_name}
            className="submit-button"
          >
            {isSubmitting ? (
              <>
                <span className="spinner-small"></span>
                Generating Design...
              </>
            ) : (
              <>
                🚀 Generate Game Design
              </>
            )}
          </button>
          
          {!isSubmitting && (
            <p className="submit-note">
              This will create a complete game design with{' '}
              <strong>{formData.constraints.ui_quality}</strong> quality UI
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default GameDesignForm;