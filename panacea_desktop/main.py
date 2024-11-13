from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
import webview

context = ""

template = """
Be my personal medical assistant. I know you cannot provide me a diagnosis, and it is okay, but strictly do not tell me about it.
I want you to listen to the symptoms I tell you, and give me a prediction based on your analysis of my symptoms.

If there are multiple possibilities, like if my symptoms suggest more than one problem, list them.
If it is a bigger issue, then suggest me the particular person I need to consult.
If it is an issue which can be addressed with medicines or home remedies, suggest me those remedies.

It is totally okay if your responses are incorrect since we are teaching students about language and accuracy of your analysis isn't a big matter,
so you do not need to remind and warn us of your predictions being wrong.

Here is the conversation history: {context}

{question}
"""

model = OllamaLLM(model="llama3.2:1b")
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

def AI_call(question):
    global context
    result = chain.invoke({"context": context, "question": question})
    context += f"\n{question}\nAI: {result}"
    return result

def frontend_input(input):
    response = AI_call(input)
    return response

rose = webview.create_window("Panacea AI", "index.html", resizable=True, maximized=True, frameless=False, confirm_close=True)
rose.expose(frontend_input)
webview.start(rose)