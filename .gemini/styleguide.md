name: "Gemini AI Code Review"
permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Run Gemini AI Code Review
        uses: some/gemini-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}