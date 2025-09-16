# Hostel Management System

A Flask-based web application for managing hostel students, rooms, and fees.

## Prerequisites

1. Python 3.7 or higher
2. MySQL Server
3. MySQL Workbench (recommended for database management)

## Installation Steps

### 1. Install Python Dependencies

Open a terminal/command prompt and navigate to the project directory. Then run:

```bash
pip install -r requirements.txt
```

### 2. Set Up MySQL Database

1. Open MySQL Workbench
2. Create a new connection if you don't have one:
   - Host: localhost
   - Port: 3306
   - Username: root
   - Password: (your MySQL root password)

3. Create the database and tables:
   - Open a new query tab
   - Copy and paste the contents of `schema.sql`
   - Execute the query

### 3. Configure Database Connection

Edit `db_config.py` and update the following values:
```python
MYSQL_HOST = 'localhost'
MYSQL_USER = 'root'
MYSQL_PASSWORD = 'your_mysql_password'  # Change this to your MySQL root password
MYSQL_DB = 'hostel_management'
```

### 4. Run the Application

1. Open a terminal/command prompt
2. Navigate to the project directory
3. Run the application:
```bash
python app.py
```

4. Open your web browser and go to:
```
http://localhost:5000
```

## Default Login Credentials

- Username: admin
- Password: admin123

## Features

- Student Management (Add, Edit, Delete)
- Room Management (Add, Edit, Delete)
- Fee Collection
- Dashboard with Statistics

## Troubleshooting

1. **Database Connection Error**
   - Check if MySQL server is running
   - Verify database credentials in `db_config.py`
   - Ensure database and tables are created

2. **Module Not Found Error**
   - Make sure all dependencies are installed
   - Try running `pip install -r requirements.txt` again

3. **Port Already in Use**
   - The default port is 5000
   - If it's in use, you can change it in `app.py` by modifying the last line:
     ```python
     app.run(debug=True, port=5001)  # Change to any available port
     ```

## Project Structure

```
hostel-management/
├── app.py              # Main application file
├── db_config.py        # Database configuration
├── requirements.txt    # Python dependencies
├── schema.sql          # Database schema
├── static/             # Static files (CSS, JS, images)
└── templates/          # HTML templates
    ├── base.html
    ├── login.html
    ├── dashboard.html
    ├── students.html
    ├── add_student.html
    ├── edit_student.html
    ├── rooms.html
    ├── add_room.html
    ├── fees.html
    └── collect_fee.html
```

## Support

If you encounter any issues, please check the troubleshooting section above. For additional help, you can:
1. Check the error messages in the terminal
2. Verify all installation steps are completed
3. Ensure MySQL server is running
4. Make sure all required Python packages are installed 