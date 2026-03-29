# Runbook

## Starting the Service
```bash
npm install
npm start
```
Server runs on `http://localhost:3000`.

## Running Tests
```bash
npm test
```

## Common Issues

### Port already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Tests failing after changes
Run `npm run build` first if using TypeScript, then `npm test`.

## Health Check
```bash
curl http://localhost:3000/todos
# Should return 200 with JSON array
```
