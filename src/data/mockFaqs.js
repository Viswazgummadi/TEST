export const mockFaqs = [
  {
    id: "faq1",
    repoId: "repo1",
    question: "How do I set up the backend environment?",
    answer:
      "To set up the backend, you first need to install all dependencies using `npm install`, then create a `.env` file based on the `.env.example` template and fill in your database credentials and API keys.",
  },
  {
    id: "faq2",
    repoId: "repo1",
    question: "What is the primary function of the Core API?",
    answer:
      "The Core API is responsible for handling all user authentication, data processing, and real-time communication sockets for the chat interface. It serves as the central hub for all application logic.",
  },
  {
    id: "faq3",
    repoId: "repo2",
    question: "How do I deploy the personal website?",
    answer:
      "The personal website is optimized for one-click deployment on Vercel. Simply connect your GitHub repository to a new Vercel project and it will build and deploy automatically on every push to the `main` branch.",
  },
  {
    id: "faq4",
    repoId: "repo3",
    question: "What is the purpose of the dotfiles repository?",
    answer:
      "This repository contains personalized configuration files (`dotfiles`) for various development tools like Neovim, Zsh, and Tmux. It allows for a consistent and portable development environment across multiple machines.",
  },
];
