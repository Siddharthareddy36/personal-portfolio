import sqlite3
import os
from flask import Flask, render_template, request, jsonify, g, redirect, url_for, make_response

app = Flask(__name__)

# --- Database Setup ---
DATABASE = 'messages.db'
# IMPORTANT: Change this to a strong, random string!
INBOX_PASSWORD = 'admin123' 

def get_db():
    """Get a database connection."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Allows accessing columns by name
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Close the database connection at the end of the request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize the database and create the table if it doesn't exist."""
    with app.app_context():
        db = get_db()
        try:
            with app.open_resource('schema.sql', mode='r') as f:
                db.cursor().executescript(f.read())
            db.commit()
            print("Database initialized or table already exists.")
        except Exception as e:
            # This can happen if schema.sql isn't found, but the helper below will create it.
            print(f"Note: Error opening schema.sql (might not exist yet): {e}")


# --- Routes ---

@app.route('/')
def home():
    """Serve the main portfolio page."""
    return render_template('index.html')

@app.route('/submit_message', methods=['POST'])
def submit_message():
    """Handle the contact form submission."""
    if request.method == 'POST':
        try:
            # Get form data
            name = request.form['name']
            email = request.form['email']
            message = request.form['message']

            # Insert into database
            db = get_db()
            db.execute(
                'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
                (name, email, message)
            )
            db.commit()

            # Return a success JSON response
            return jsonify({
                'success': True,
                'message': 'Message Sent Successfully!'
            })
        except Exception as e:
            print(f"Error: {e}")
            # Return an error JSON response
            return jsonify({
                'success': False,
                'message': 'An error occurred. Please try again.'
            }), 500

# --- Optional Admin Inbox ---

@app.route('/inbox', methods=['GET', 'POST'])
def inbox():
    """A simple, password-protected inbox to view messages."""
    error = None
    messages = []
    
    # Check if user is already "logged in" via cookie
    if request.cookies.get('auth') == INBOX_PASSWORD:
        db = get_db()
        messages_cursor = db.execute('SELECT * FROM messages ORDER BY timestamp DESC')
        messages = messages_cursor.fetchall()
        return render_template('inbox.html', messages=messages, error=None)

    # Handle login attempt
    if request.method == 'POST':
        if request.form['password'] == INBOX_PASSWORD:
            # Correct password. Fetch messages and set a cookie.
            db = get_db()
            messages_cursor = db.execute('SELECT * FROM messages ORDER BY timestamp DESC')
            messages = messages_cursor.fetchall()
            
            # Create a response object to set the cookie
            resp = make_response(render_template('inbox.html', messages=messages, error=None))
            # Set a simple cookie to remember the session
            resp.set_cookie('auth', INBOX_PASSWORD, max_age=60*60*24) # Stays for 1 day
            return resp
        else:
            # Incorrect password
            error = 'Invalid password. Please try again.'
            return render_template('inbox.html', messages=[], error=error), 401

    # If not logged in and not POSTing, show the login prompt
    return render_template('inbox.html', messages=[], error=error)


# --- Database Schema (Helper file) ---
# Create a new file named 'schema.sql' in the same directory as app.py
# This file defines our database table.

if not os.path.exists('schema.sql'):
    with open('schema.sql', 'w') as f:
        f.write("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)

# --- Run the App ---

# Initialize the database on startup
# This will run when deployed on Render
init_db()

# This part only runs when you run "py app.py" locally
if __name__ == '__main__':
    app.run(debug=True)
