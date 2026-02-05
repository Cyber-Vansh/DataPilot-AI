# Natural Language SQL Generator

Hey there! Welcome to the repository for the Natural Language SQL Generator.

This project is pretty cool - it's basically a bridge between plain English and raw database data. The idea is to let anyone (even those who've never written a line of SQL in their life) ask questions about their data and get answers instantly. I am using AI to translate those questions into SQL queries, run them, and show the results.

## How it works

1.  **You ask a question**: "Show me the top 5 customers by spending."
2.  **AI does the heavy lifting**: The Python service takes that question, looks at the database structure, and writes the SQL query for it.
3.  **The system runs it**: The system executes the query safely against simple MySQL database.
4.  **You get results**: It shows you the data in a nice table on the dashboard.

## Tech Stack

I am using a microservices approach to keep things clean and modular. Here is what I am building with:

- **Frontend**: Next.js with TypeScript. I wanted a snappy, modern UI, so this was a no-brainer.
- **Backend**: Node.js & Express.js. This handles the API traffic and manages user sessions.
- **AI Service**: Python with LangChain. Python is the king of AI, and LangChain makes working with LLMs (I am using Google Gemini) super easy.
- **Databases**:
  - **MySQL**: This holds the actual "business" data being queried.
  - **MongoDB**: This is used to keep a log of all the chat history and queries.
- **Infrastructure**: Docker. Everything runs in containers, so there is no need to worry about "it works on my machine" issues.

## Getting Started

To get this up and running, you'll need Docker installed.

1.  Clone the repo.
2.  Run `docker-compose up`.
3.  That's it!

Feel free to poke around the code and see how I have glued everything together.
