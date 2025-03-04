# Real-time Betting Platform

A WebSocket-based betting platform featuring color and number game modes with dynamic payout systems.

## Features

- Real-time betting system using WebSocket
- Color and number betting modes
  - Colors: Red, Green, Purple
  - Numbers: 0-9 with special combinations
- Dynamic payout system
  - 2x payout for color matches
  - 9x payout for number matches
- Live game periods with cooldown
- User wallet management
- Transaction history
- Responsive design

## Special Color Combinations

- Number 0: Purple + Red
- Number 5: Purple + Green
- Even numbers: Green
- Odd numbers: Red

## Tech Stack

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Real-time: WebSocket (ws)
- Styling: Tailwind CSS + shadcn/ui
- State Management: TanStack Query
- Authentication: Express Session + Passport

## Installation

1. Clone the repository
```bash
git clone [repository-url]
cd [repository-name]
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## Development

The application uses:
- Vite for frontend development
- Express for the backend server
- WebSocket for real-time updates
- In-memory storage for development

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
