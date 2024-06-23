import { embeddings, llm } from "@/libs/openAI";
import { supabaseClient } from "@/libs/supabaseClient";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";

export interface IFile {
  id?: number | undefined;
  url: string;
  created_at?: Date | undefined;
}

export async function saveFile(url: string, content: string): Promise<IFile> {
  const doc = await supabaseClient
    .from("files")
    .select()
    .eq("url", url)
    .single<IFile>();

  if (!doc.error && doc.data?.id) return doc.data;

  const { data, error } = await supabaseClient
    .from("files")
    .insert({ url })
    .select()
    .single<IFile>();

  if (error) throw error;

  const splitter = new RecursiveCharacterTextSplitter({
    separators: ["\n\n", "\n", " ", ""],
  });

  const output = await splitter.createDocuments([content]);
  const docs = output.map((d) => ({
    ...d,
    metadata: { ...d.metadata, file_id: data.id },
  }));

  await SupabaseVectorStore.fromDocuments(docs, embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  return data;
}

export async function getSummarization(fileId: number): Promise<string> {
  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  const retriever = vectorStore.asRetriever({
    filter: (rpc) => rpc.filter("metadata->>file_id", "eq", fileId),
    k: 2,
  });

  const SYSTEM_TEMPLATE = `Use the following pieces of context, explain what is it about and summarize it.
      If you can't explain it, just say that you don't know, don't try to make up some explanation.
      ----------------
      {context}`;

  const messages = [
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
    HumanMessagePromptTemplate.fromTemplate("{format_answer}"),
  ];
  const prompt = ChatPromptTemplate.fromMessages(messages);
  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      format_answer: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  const format_summarization =
    `
    Give it title, subject, description, and the conclusion of the context in this format, replace the brackets with the actual content:
    
    [Write the title here]

    By: [Name of the author or owner or user or publisher or writer or reporter if possible, otherwise leave it "Not Specified"]

    [Write the subject, it could be a long text, at least minimum of 300 characters]

    ----------------

    [Write the description in here, it could be a long text, at least minimum of 1000 characters]

    Conclusion:
    [Write the conclusion in here, it could be a long text, at least minimum of 500 characters]
    `;

  const summarization = await chain.invoke(format_summarization);

  return summarization;
}
