import bcrypt

# List of plain passwords
passwords = ['1', '2', '3', '4', '5']

# Generate hashes
for i, password in enumerate(passwords):
    # Convert password to bytes
    password_bytes = password.encode('utf-8')
    
    # Generate salt and hash
    salt = bcrypt.gensalt(10)
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Convert hash to string for storage
    hashed_str = hashed.decode('utf-8')
    
    print(f"Password {i+1}: {hashed_str}")