import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InitialPrompt from "../components/InitialPrompt";
import ChatInputBar from "../components/ChatInputBar";
import ConversationView from "../components/ConversationView";
import { useSearchParams } from "react-router-dom"; // ✅ Import useSearchParams
import createFetchApi from "../utils/api";
 
// ✅ Accept setRepoFilter and dataSources props
const ChatPage = ({ selectedRepo, setRepoFilter, dataSources, apiBaseUrl }) => {
  const [pageState, setPageState] = useState("initial");
  const [messages, setMessages] = useState([]);
  const scrollContainerRef = useRef(null);
  const currentAiMessageIdRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams(); // ✅ Initialize useSearchParams
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState(null);
  const initialDefaultModelId = "gemini-1.5-flash";

  const fetchApi = useMemo(() => createFetchApi(apiBaseUrl), [apiBaseUrl]);

  const isRepoSelected = !!selectedRepo;
  useEffect(() => {
    const getModels = async () => {
      setIsLoadingModels(true);
      setModelsError(null);
      try {
        const fetchedModels = await fetchApi("/api/chat/available-models/");
        setAvailableModels(fetchedModels || []);
        if (fetchedModels && fetchedModels.length > 0) {
          const defaultModel = fetchedModels.find(m => m.id === initialDefaultModelId) || fetchedModels[0];
          setSelectedModel(defaultModel);
        } else {
          setSelectedModel(null);
        }
      } catch (err) {
        setModelsError(err.message);
        setAvailableModels([]);
        setSelectedModel(null);
      } finally {
        setIsLoadingModels(false);
      }
    };
    getModels();
  }, [fetchApi, initialDefaultModelId]);
  // ✅ NEW useEffect to handle URL source parameter
  useEffect(() => {
    const sourceIdFromUrl = searchParams.get('source');
    if (sourceIdFromUrl && dataSources.length > 0) {
      // Find the source object to ensure it's valid
      const foundSource = dataSources.find(ds => ds.id === sourceIdFromUrl);
      if (foundSource && selectedRepo !== sourceIdFromUrl) {
        setRepoFilter(sourceIdFromUrl); // Update the parent's repoFilter state
        // Clean up the URL parameter to prevent re-triggering on refresh
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, dataSources, selectedRepo, setRepoFilter, setSearchParams]);


  useEffect(() => {
    if (
      pageState !== "initial" &&
      messages.length > 0 &&
      scrollContainerRef.current
    ) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, pageState]);

  const handleSubmit = async (queryText) => {
    if (!queryText.trim()) {
      if (pageState === "processing") setPageState("active_conversation");
      return;
    }

    if (!isRepoSelected) {
      const repoNotSelectedError = {
        id: `syserr-repo-${Date.now()}`,
        text: "Please select a data source from the header dropdown to begin chatting.",
        author: "system_error",
      };
      setMessages((prev) => [...prev, repoNotSelectedError]);
      setPageState("active_conversation");
      return;
    }

    // Block 2: Check if an AI model is selected
    if (!selectedModel) {
      const modelNotSelectedError = {
        id: `syserr-model-${Date.now()}`,
        text: "No model selected. Please click the 💻 icon in the input bar to choose a model.",
        author: "system_error",
      };
      setMessages((prev) => [...prev, modelNotSelectedError]);
      setPageState("active_conversation");
      return;
    }
    setPageState("processing");

    const newUserMessage = {
      id: `user-${Date.now()}`,
      text: queryText,
      author: "user",
    };

    setMessages((prevMessages) => {
      if (
        pageState === "initial" ||
        (prevMessages.length > 0 &&
          prevMessages.every((m) => m.author === "system_error"))
      ) {
        return [newUserMessage];
      }
      return [...prevMessages, newUserMessage];
    });

    const aiMessageId = `llm-${Date.now()}`;
    currentAiMessageIdRef.current = aiMessageId;

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: aiMessageId,
        text: "",
        author: "llm",
        isLoading: true,
        traceUrl: undefined,
        isError: false,
      },
    ]);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/`, { // Construct full URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryText,
          model: selectedModel.id,
          data_source_id: selectedRepo,
        }),
      });
      if (!response.ok) {
        let errorData = { error: `API Error: ${response.status} ${response.statusText}` };
        try {
          errorData = await response.json();
        } catch (e) {
          console.warn("Could not parse JSON error response from server:", response.statusText, e);
        }

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === currentAiMessageIdRef.current
              ? {
                ...msg,
                text: errorData.error || `Service Error: ${response.status}`,
                isLoading: false,
                isError: true,
              }
              : msg
          )
        );
        setPageState("active_conversation");
        currentAiMessageIdRef.current = null;
        return;
      }

      if (!response.body) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === currentAiMessageIdRef.current
              ? { ...msg, text: "Error: Empty response from server.", isLoading: false, isError: true }
              : msg
          )
        );
        setPageState("active_conversation");
        currentAiMessageIdRef.current = null;
        return;
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === currentAiMessageIdRef.current ? { ...msg, isLoading: false } : msg
            )
          );
          break;
        }

        const eventLines = value.split('\n\n');
        for (const line of eventLines) {
          if (line.startsWith('data: ')) {
            const jsonData = line.substring('data: '.length);
            if (jsonData.trim()) {
              try {
                const parsedData = JSON.parse(jsonData);
                if (parsedData.chunk) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === currentAiMessageIdRef.current
                        ? { ...msg, text: msg.text + parsedData.chunk }
                        : msg
                    )
                  );
                } else if (parsedData.error) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === currentAiMessageIdRef.current
                        ? {
                          ...msg,
                          text: msg.text + (msg.text ? '\n' : '') + `[Stream Error: ${parsedData.error}]`,
                          isLoading: false,
                          isError: true,
                        }
                        : msg
                    )
                  );
                } else if (parsedData.status === 'done') {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === currentAiMessageIdRef.current
                        ? { ...msg, isLoading: false, traceUrl: parsedData.traceUrl || msg.traceUrl }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error('Error parsing JSON from stream chunk:', jsonData, e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat submission or streaming error:", error);
      setMessages((prevMessages) => {
        const aiMessageExists = prevMessages.some(msg => msg.id === currentAiMessageIdRef.current);
        if (aiMessageExists) {
          return prevMessages.map((msg) =>
            msg.id === currentAiMessageIdRef.current
              ? {
                ...msg,
                text: (msg.text || "") + (msg.text ? '\n' : '') + `Error: ${error.message || "A problem occurred."}`,
                isLoading: false,
                isError: true,
              }
              : msg
          );
        } else {
          return [
            ...prevMessages,
            {
              id: currentAiMessageIdRef.current || `llm-err-${Date.now()}`,
              text: `Error: ${error.message || "A problem occurred."}`,
              author: "llm",
              isLoading: false,
              isError: true,
            },
          ];
        }
      });
    } finally {
      setPageState("active_conversation");
      if (currentAiMessageIdRef.current) {
        currentAiMessageIdRef.current = null;
      }
    }
  };

  const isChatInputDisabled = pageState === "processing";
  const showInitialPromptContent =
    pageState === "initial" &&
    (!messages.length ||
      messages.every((m) => m.author === "system_error"));

  const initialCenteredBlockMaxWidth = "max-w-xl";

  return (
    <div className="w-full h-full flex flex-col">
      <AnimatePresence mode="wait">
        {pageState === "initial" ? (
          <motion.div
            key="initial-page-state"
            exit={{
              opacity: 0,
              scale: 0.95,
              y: -20,
              transition: { duration: 0.3 },
            }}
            className="w-full flex-1 flex flex-col items-center justify-center p-4 min-h-0 pb-20 sm:pb-24 md:pb-28 lg:pb-32"
          >
            <div
              className={`flex flex-col items-center ${initialCenteredBlockMaxWidth} w-full`}
            >
              {showInitialPromptContent && (
                <div className="w-full mb-3">
                  <InitialPrompt />
                </div>
              )}
              {!showInitialPromptContent && messages.length > 0 && (
                <div
                  className={`w-full ${initialCenteredBlockMaxWidth} mx-auto mb-3`}
                >
                  <ConversationView
                    messages={messages.filter(
                      (m) => m.author === "system_error"
                    )}
                  />
                </div>
              )}
              <div className="w-full">
                <ChatInputBar
                  onSubmit={handleSubmit}
                  isDisabled={isChatInputDisabled}
                  isRepoSelected={isRepoSelected}
                  // ✅ Pass all the new state and handlers down
                  availableModels={availableModels}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  isLoadingModels={isLoadingModels}
                  modelsError={modelsError}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="conversation-page-state"
            className="w-full flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto min-h-0 custom-scrollbar"
            >
              <div className="w-full">
                <ConversationView messages={messages} />
              </div>
            </div>
            <div className="flex-shrink-0 w-full pt-3 pb-3">
                <ChatInputBar
                  onSubmit={handleSubmit}
                  isDisabled={isChatInputDisabled}
                  isRepoSelected={isRepoSelected}
                  // ✅ Pass all the new state and handlers down
                  availableModels={availableModels}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  isLoadingModels={isLoadingModels}
                  modelsError={modelsError}
                />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;