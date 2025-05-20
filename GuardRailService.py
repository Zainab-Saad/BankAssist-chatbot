# Requires: pip install -qU Groq
# TODO - Add api key from env variables
from groq import Groq

class GuardRailService:
  def __init__(self) -> None:
    self.MLCommons_taxonomy_hazards = {
    "S1": "Violent Crimes",
    "S2": "Non-Violent Crimes",
    "S3": "Sex-Related Crimes",
    "S4": "Child Sexual Exploitation",
    "S5": "Defamation",
    "S6": "Specialized Advice",
    "S7": "Privacy",
    "S8": "Intellectual Property",
    "S9": "Indiscriminate Weapons",
    "S10": "Hate",
    "S11": "Suicide & Self-Harm",
    "S12": "Sexual Content",
    "S13": "Elections",
    "S14": "Code Interpreter Abuse"
    }
    self.client =  Groq(api_key="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") #api_key="GROQ_API_KEY"
    self.model="llama-guard-3-8b"

  def guardRailCheck(self, query:str):
    chat_completion = self.client.chat.completions.create(
      messages=[
          {
          "role": "user",
          "content": query
          },
      ],
      model=self.model,
    )
    response = chat_completion.choices[0].message.content.split()
    # now response is like ['unsafe', 'S9']
    if response[0]=="unsafe":
      res = {
          "isUnsafe":True,
          "MLCommons_taxonomy":response[1],
          "hazard":self.MLCommons_taxonomy_hazards[response[1]]
      }
    else:
      res = {
          "isUnsafe":False
      }
    return res
