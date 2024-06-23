import axios from "axios";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<any>(null);

  const onSubmit = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.post("/api/content", {
        url,
      });
      setResult(res.data.result);
    } catch (err) {
      console.error("Failed to fetch content", err);
      setError(err as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100vh", overflowY: "auto" }}>
      <Container
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          position: "sticky",
          top: 0,
          zIndex: 2,
          py: 2,
        }}
      >
        <Typography sx={{ mb: 2, fontSize: "24px" }}>
          Summarize the content of any page
        </Typography>

        <TextField
          fullWidth
          label="Input page's URL"
          value={url}
          onChange={(e) => {
            if (result) setResult("");
            setUrl(e.target.value);
          }}
          sx={{ mb: 2 }}
        />

        <Button
          disabled={loading}
          variant="contained"
          onClick={onSubmit}
        >
          Summarize
        </Button>
      </Container>

      <Container maxWidth="lg" sx={{ py: 2 }}>
        {loading ? (
          <LinearProgress />
        ) : (
          <Stack sx={{ gap: 2 }}>
            {result && (
              <Alert>
                <Typography
                  sx={{
                    whiteSpace: "pre-line",
                    wordBreak: "break-word",
                  }}
                >
                  {result}
                </Typography>
              </Alert>
            )}
            {error && <Alert severity="error">{error.message || error}</Alert>}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
