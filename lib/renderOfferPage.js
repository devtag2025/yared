/**
 * Generate HTML for the Offer Page
 */
const renderOfferPage = (job, token, message = null) => {
    const isPending = job.status === 'pending';
    const isExpired = new Date() > new Date(job.expiresAt) || job.status === 'expired';
    
    let content = '';
    
    if (message) {
        content = `<div class="alert">${message}</div>`;
    } else if (isExpired) {
        content = `<div class="card error">
            <h2>Offer Expired</h2>
            <p>This job offer is no longer available.</p>
        </div>`;
    } else if (job.status === 'accepted') {
        content = `<div class="card success">
            <h2>Offer Accepted!</h2>
            <p>Thank you. We have confirmed your assignment.</p>
        </div>`;
    } else if (job.status === 'declined') {
        content = `<div class="card">
            <h2>Offer Declined</h2>
            <p>You have declined this job. We will contact you for future opportunities.</p>
        </div>`;
    } else {
        // Pending State - Show Details and Buttons
        content = `
        <div class="card">
            <div class="header">
                <h2>New Cleaning Job</h2>
                <span class="badge">Expiring Soon</span>
            </div>
            
            <div class="details">
                <p><strong>Job ID:</strong> ${job.jobDetails.id || 'N/A'}</p>
                <p><strong>Location:</strong> ${job.jobDetails.location || 'N/A'}</p>
                <p><strong>Time:</strong> ${job.jobDetails.datetime || 'N/A'}</p>
                <p><strong>Pay:</strong> $${job.jobDetails.pay || 'N/A'}</p>
                <p><strong>Tasks:</strong> ${job.jobDetails.tasks || 'N/A'}</p>
            </div>

            <div class="actions">
                <button onclick="respond('accept')" class="btn accept">Accept Job</button>
                <button onclick="respond('decline')" class="btn decline">Decline</button>
            </div>
            
            <div id="loading" style="display:none; text-align:center; margin-top:10px;">Processing...</div>
        </div>

        <script>
            function respond(action) {
                document.querySelector('.actions').style.display = 'none';
                document.getElementById('loading').style.display = 'block';
                
                fetch('/api/respond', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: '${token}', action: action })
                })
                .then(res => res.json())
                .then(data => {
                    if(data.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + data.error);
                        location.reload();
                    }
                })
                .catch(err => {
                    alert('Network error');
                    location.reload();
                });
            }
        </script>
        `;
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Offer</title>
        <style>
            body { font-family: -apple-system, system-ui, sans-serif; background: #f4f6f8; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1rem; }
            .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
            .details { margin: 1.5rem 0; padding: 1rem; background: #f8f9fa; border-radius: 8px; }
            .details p { margin: 0.5rem 0; color: #444; }
            .btn { width: 100%; padding: 12px; margin-bottom: 10px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold; }
            .accept { background: #22c55e; color: white; }
            .decline { background: #ef4444; color: white; }
            .success { border-left: 5px solid #22c55e; }
            .error { border-left: 5px solid #ef4444; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .badge { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .alert { padding: 1rem; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 1rem; }
        </style>
    </head>
    <body>
        ${content}
    </body>
    </html>
    `;
};

module.exports = { renderOfferPage };
