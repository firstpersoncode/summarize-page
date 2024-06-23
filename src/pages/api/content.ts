
import { getContent } from "@/services/content";
import { getSummarization, saveFile } from "@/services/file";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(404).json({ message: "Not found" });

  const { body } = req;

  try {
    const content = await getContent(body.url);
    const file = await saveFile(body.url, content);
    const result = await getSummarization(file.id as number);
    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ error: err });
  }
}
