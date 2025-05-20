from llama_index.core import VectorStoreIndex, Settings
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

class LLMService:
    def __init__(self):
        self.initialize_llm()
        self.index = None
        self.query_engine = None
    
    def initialize_llm(self):
        Settings.embed_model = HuggingFaceEmbedding(
            # model_name="intfloat/e5-large-v2"
            model_name="BAAI/bge-small-en-v1.5"
        )

        model_name = "meta-llama/Llama-3.2-3B-Instruct"
        quant_config = {
            "load_in_4bit": True,
            "bnb_4bit_compute_dtype": torch.float16,
            "bnb_4bit_quant_type": "nf4"
        }
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name, 
            quantization_config=quant_config, 
            device_map="auto"
        )

        system_prompt = ("You are a helpful bank assistant. "
        "Answer user questions clearly and factually based only on the given context. "
        "Do not add greetings, sign-offs, or suggestions. "
        "Do not mention context or sources. Just answer the question directly."
)
       
                    
        Settings.llm = HuggingFaceLLM(
            model=self.model,
            tokenizer=self.tokenizer,
            context_window=4096,
            max_new_tokens=512,
            system_prompt=system_prompt,
            generate_kwargs={"temperature": 0.3, "do_sample": False},
            model_kwargs={"torch_dtype": torch.float16}
        )
    
    def initialize_index(self, documents):
        self.index = VectorStoreIndex.from_documents(documents, embed_model=Settings.embed_model)
        self.query_engine = self.index.as_query_engine(
            similarity_top_k=5,
            llm=Settings.llm,
            embed_model=Settings.embed_model
        )
    
    def query(self, question):
        if not self.query_engine:
            raise ValueError("Index not initialized")
        return str(self.query_engine.query(question))
