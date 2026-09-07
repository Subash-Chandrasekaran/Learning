import tkinter as tk
from random import randint

def change_background():
    # Generate a random RGB tuple
    r = lambda: randint(0, 255)
    
    # Convert to hexadecimal string
    random_color = '#%02X%02X%02X' % (r(), r(), r())
    
    ###label = None
    label.config(bg=random_color)  # Change background color of the label

# Create the main window
root = tk.Tk()
root.title("Hello World with Random Background")

# Label to display "Hello World"
text_label = tk.Label(root, text="Hello World", font=("Helvetica", 18))
text_label.pack(pady=20)

# Change background color when the program runs
change_background()

# Start the Tkinter event loop
root.mainloop()
