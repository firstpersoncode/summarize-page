import axios from "axios";

export async function getContent(url: string): Promise<string> {
  let htmlContent: string = "";

  const response = await axios.get(url as string);

  htmlContent = response.data;

  if (!htmlContent) return "";

  return htmlContent
    .replace(/style="[^"]*"/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\s*on\w+="[^"]*"/gi, "")
    .replace(
      /<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ");
}
