To-Do List with Multiple Lists
This is a web-based to-do list application that allows you to create multiple lists, each containing categories, subcategories, and tasks. The app supports features like setting reset dates for tasks, marking tasks as urgent, reordering tasks, and more.

Features
Multiple Lists: Manage multiple to-do lists, each represented as a tab.
Categories and Subcategories: Organize tasks into categories and optional subcategories for better structure.
Tasks: Add tasks with optional due dates. Mark tasks as completed or set them as “In Process.”
Resets and Intervals: Set categories to reset tasks automatically on certain intervals or on the 1st of the month.
Urgent Tasks: Tasks with due dates approaching are automatically moved to an “Urgent” category.
Editing and Reordering: (Planned) Rename lists, categories, and tasks. Reorder categories and tasks easily.
Notes for Tasks: (Planned) Add a notepad function under tasks for associated notes or details.
Getting Started
Prerequisites
A modern web browser (Chrome, Firefox, Safari, or Edge) supporting ES6 modules.
Basic understanding of HTML, CSS, and JavaScript if you plan to modify the code.
Installation
Clone or Download:
Clone the repository from GitHub or download the ZIP file and extract it:

bash
Copy code
git clone https://github.com/yourusername/your-repo-name.git
Open in Browser:
Open index.html in your preferred browser.

Usage
Add Lists: Click the “Add New List” button to create a new list tab.
Add Categories: Within each list, add categories and optional subcategories for better organization.
Add Tasks: For each category, add tasks. You can specify due dates and whether a task should allow “In Process” state.
Mark Complete: Check the box next to a task to mark it as completed.
Urgent Tasks: Tasks due soon will automatically move to the “Urgent” category.
Resetting Categories: Set intervals or monthly resets to automatically reset tasks in specific categories.
Editing and Reordering (Future Updates): We plan to allow editing of names for lists, categories, and tasks, as well as reordering tabs and tasks.
Saving and Loading
Save: Use the “Save To-Do Lists” button to save your current lists and tasks to a JSON file.
Load: Use the “Load To-Do Lists” button to load previously saved data.
Development
This project is currently being refactored to a modular architecture using ES6 modules to improve maintainability and scalability. We aim to break the code into separate modules for models, views, controllers, and utilities.

Planned Refactoring Steps:

Create Modules for models (models.js), views (views.js), controllers (controllers.js), and utilities (utils.js).
Update Imports/Exports to ensure a clean, maintainable code structure.
Test Incrementally as we refactor to ensure backward compatibility and feature stability.
Contributing
Contributions are welcome! Please open an issue or submit a pull request for feedback or improvements.

License
If you decide to license your project, you can add a license here. For example:

MIT License
Apache 2.0 License
If you’re unsure, you can leave this blank until you decide on a license.
