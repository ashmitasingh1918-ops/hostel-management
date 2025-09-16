from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_mysqldb import MySQL
import db_config
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# MySQL Config
app.config['MYSQL_HOST'] = db_config.MYSQL_HOST
app.config['MYSQL_USER'] = db_config.MYSQL_USER
app.config['MYSQL_PASSWORD'] = db_config.MYSQL_PASSWORD
app.config['MYSQL_DB'] = db_config.MYSQL_DB

mysql = MySQL(app)

# Login route
@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))
        user = cur.fetchone()
        cur.close()

        if user:
            session['user_id'] = user[0]
            session['username'] = user[1]
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')

    return render_template('login.html')

# Dashboard route
@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    cur = mysql.connection.cursor()
    cur.execute("SELECT COUNT(*) FROM students")
    students_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM rooms WHERE occupied < capacity")
    available_rooms = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM payments WHERE payment_date IS NULL")
    pending_fees = cur.fetchone()[0]
    cur.execute("SELECT * FROM students ORDER BY student_id DESC LIMIT 5")
    recent_students = cur.fetchall()
    cur.close()
    
    return render_template('dashboard.html',
                         students_count=students_count,
                         available_rooms=available_rooms,
                         pending_fees=pending_fees,
                         recent_students=recent_students)

# Logout route
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# Student Management
@app.route('/students')
def students():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM students")
    students = cur.fetchall()
    cur.close()
    return render_template('students.html', students=students)

@app.route('/add_student', methods=['GET', 'POST'])
def add_student():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['contact']
        department = request.form['department']
        year = request.form['year']

        cur = mysql.connection.cursor()
        try:
            cur.execute("INSERT INTO students (name, email, phone, department, year) VALUES (%s, %s, %s, %s, %s)",
                       (name, email, phone, department, year))
            mysql.connection.commit()
            flash('Student added successfully')
            return redirect(url_for('students'))
        except Exception as e:
            flash(str(e))
        finally:
            cur.close()

    return render_template('add_student.html')

@app.route('/delete_student/<int:student_id>', methods=['POST'])
def delete_student(student_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    cur = mysql.connection.cursor()
    try:
        # First delete any payments associated with the student
        cur.execute("DELETE FROM payments WHERE student_id = %s", (student_id,))
        # Then delete the student
        cur.execute("DELETE FROM students WHERE student_id = %s", (student_id,))
        mysql.connection.commit()
        flash('Student deleted successfully', 'success')
    except Exception as e:
        flash(f'Error deleting student: {str(e)}', 'danger')
    finally:
        cur.close()
    
    return redirect(url_for('students'))

@app.route('/edit_student/<int:student_id>', methods=['GET', 'POST'])
def edit_student(student_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    cur = mysql.connection.cursor()
    
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        phone = request.form['phone']
        department = request.form['department']
        year = request.form['year']
        
        try:
            cur.execute("""
                UPDATE students 
                SET name = %s, email = %s, phone = %s, department = %s, year = %s
                WHERE student_id = %s
            """, (name, email, phone, department, year, student_id))
            
            mysql.connection.commit()
            flash('Student updated successfully', 'success')
            return redirect(url_for('students'))
        except Exception as e:
            flash(f'Error updating student: {str(e)}', 'danger')
        finally:
            cur.close()
    
    # Fetch student details for the form
    try:
        cur.execute("SELECT * FROM students WHERE student_id = %s", (student_id,))
        student = cur.fetchone()
        if not student:
            flash('Student not found', 'danger')
            return redirect(url_for('students'))
    except Exception as e:
        flash(f'Error fetching student: {str(e)}', 'danger')
        return redirect(url_for('students'))
    finally:
        cur.close()
    
    return render_template('edit_student.html', student=student)

# Room Management
@app.route('/rooms')
def rooms():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM rooms")
    rooms = cur.fetchall()
    cur.close()
    return render_template('rooms.html', rooms=rooms)

@app.route('/add_room', methods=['GET', 'POST'])
def add_room():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    cur = mysql.connection.cursor()
    
    if request.method == 'POST':
        room_number = request.form['room_number']
        room_type = request.form['room_type']
        capacity = request.form['capacity']
        hostel_id = request.form['hostel_id']
        
        try:
            # Check if room number already exists
            cur.execute("SELECT * FROM rooms WHERE room_number = %s", (room_number,))
            existing_room = cur.fetchone()
            
            if existing_room:
                flash('Room number already exists', 'danger')
                return redirect(url_for('add_room'))
            
            # Insert new room
            cur.execute("""
                INSERT INTO rooms (room_number, room_type, capacity, hostel_id, occupied)
                VALUES (%s, %s, %s, %s, 0)
            """, (room_number, room_type, capacity, hostel_id))
            
            mysql.connection.commit()
            flash('Room added successfully', 'success')
            return redirect(url_for('rooms'))
        except Exception as e:
            flash(f'Error adding room: {str(e)}', 'danger')
        finally:
            cur.close()
    
    # Fetch available hostels for the form
    try:
        cur.execute("SELECT hostel_id, name FROM hostels")
        hostels = cur.fetchall()
    except Exception as e:
        flash(f'Error fetching hostels: {str(e)}', 'danger')
        hostels = []
    finally:
        cur.close()
    
    return render_template('add_room.html', hostels=hostels)

@app.route('/delete_room/<int:room_id>', methods=['POST'])
def delete_room(room_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    cur = mysql.connection.cursor()
    try:
        # Check if room is occupied
        cur.execute("SELECT occupied FROM rooms WHERE room_id = %s", (room_id,))
        room = cur.fetchone()
        
        if room and room[0] > 0:
            flash('Cannot delete room that is currently occupied', 'danger')
            return redirect(url_for('rooms'))
        
        # Delete the room
        cur.execute("DELETE FROM rooms WHERE room_id = %s", (room_id,))
        mysql.connection.commit()
        flash('Room deleted successfully', 'success')
    except Exception as e:
        flash(f'Error deleting room: {str(e)}', 'danger')
    finally:
        cur.close()
    
    return redirect(url_for('rooms'))

# Fee Management
@app.route('/fees')
def fees():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT p.payment_id, s.name, p.amount, p.payment_date, p.payment_type
        FROM payments p
        JOIN students s ON p.student_id = s.student_id
    """)
    fees = cur.fetchall()
    cur.close()
    return render_template('fees.html', fees=fees)

@app.route('/collect_fee', methods=['GET', 'POST'])
def collect_fee():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        student_id = request.form['student_id']
        amount = request.form['amount']
        payment_type = request.form['payment_type']

        cur = mysql.connection.cursor()
        try:
            cur.execute("INSERT INTO payments (student_id, amount, payment_date, payment_type) VALUES (%s, %s, %s, %s)",
                       (student_id, amount, datetime.now().date(), payment_type))
            mysql.connection.commit()
            flash('Fee collected successfully')
            return redirect(url_for('fees'))
        except Exception as e:
            flash(str(e))
        finally:
            cur.close()

    cur = mysql.connection.cursor()
    cur.execute("SELECT student_id, name FROM students")
    students = cur.fetchall()
    cur.close()
    return render_template('collect_fee.html', students=students)

if __name__ == '__main__':
    app.run(debug=True) 