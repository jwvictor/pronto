// Import required packages
import OpenAI from "openai";
import nunjucks from "nunjucks";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Create an OpenAI client instance
const openai = new OpenAI();

// Setup nunjucks
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
nunjucks.configure({ 
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true
});

// Runtime utilities for prompt language
const _promptRuntime = {
  // Load a prompt template from a file and render it with the input
  loadAndRenderPrompt(promptPath, input) {
    try {
      // First try loading as an absolute path
      let templatePath = promptPath;
      
      // If not absolute, try relative to current directory
      if (!path.isAbsolute(promptPath)) {
        // Check current directory first
        const currentDirPath = path.join(process.cwd(), promptPath);
        if (fs.existsSync(currentDirPath)) {
          templatePath = currentDirPath;
        } else {
          // Then check relative to the executing script location
          templatePath = path.join(__dirname, promptPath);
        }
      }
      
      // Read the template file
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Prompt template file not found: ${templatePath}`);
      }
      
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      
      // Render the template with the input values
      const renderedPrompt = nunjucks.renderString(templateContent, input);
      return renderedPrompt;
    } catch (error) {
      console.error(`Error loading or rendering prompt template: ${error.message}`);
      throw error;
    }
  },

  // Intelligently extract JSON from various response formats
  extractJsonFromResponse(text) {
    console.log("Extracting JSON from response:", text);
    if (!text || typeof text !== 'string') {
      console.warn("Cannot extract JSON: input is not a string");
      return null;
    }

    // Case 1: Plain JSON - try to parse the entire text as JSON
    try {
      const parsed = JSON.parse(text.trim());
      console.log("Successfully parsed full text as JSON");
      return parsed;
    } catch (e) {
      // Not a valid JSON, continue to other extraction methods
    }

    // Case 2: Look for code blocks with JSON (```json ... ```)
    const jsonCodeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    const matches = text.match(jsonCodeBlockRegex);
    
    if (matches && matches.length > 0) {
      // Try each matched code block
      for (const match of matches) {
        // Extract content between ``` markers
        const content = match.replace(/```(?:json)?\s*/, '').replace(/\s*```$/, '');
        
        try {
          const parsed = JSON.parse(content.trim());
          console.log("Successfully parsed JSON from code block");
          return parsed;
        } catch (e) {
          // This block wasn't valid JSON, try the next one
          console.warn("Failed to parse code block as JSON, trying next pattern");
        }
      }
    }

    // Case 3: Look for anything that looks like a JSON object/array
    const jsonLikeRegex = /(\{[\s\S]*?\}|\[[\s\S]*?\])/g;
    const jsonMatches = text.match(jsonLikeRegex);

    if (jsonMatches && jsonMatches.length > 0) {
      // Try each potential JSON match
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match.trim());
          console.log("Successfully parsed JSON-like content");
          return parsed;
        } catch (e) {
          // Not valid JSON, continue
        }
      }
    }

    console.warn("Could not extract JSON from the response");
    return null;
  },

  // Call a prompt with the given name, input, and type information
  async callPrompt(promptName, promptPath, input, returnType) {
    console.log(`Calling prompt ${promptName} with input:`, input);
    
    try {
      // Load and render the prompt template with the input values
      const renderedPrompt = this.loadAndRenderPrompt(promptPath, input);
      console.log("Rendered prompt:", renderedPrompt);

      // Create a system message based on the prompt name
      const systemPrompt = `You are ${promptName}. Follow the instructions carefully.`;
      
      // Call OpenAI using the responses API with messages array
      const response = await openai.responses.create({
        model: "gpt-4o", // Use the latest available model
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: renderedPrompt }
        ]
      });
      
      // Extract the output text from the response
      const outputText = response.output_text;

      console.log("Output text:", outputText);
      
      // Try to parse the output as JSON if it looks like JSON
      try {
        // Check if the output is a JSON string
        if (outputText.trim().startsWith('{') || outputText.trim().startsWith('[')) {
          console.log("Parsing response as JSON directly");
          const parsedResponse = JSON.parse(outputText);
          return this.validateType(parsedResponse, returnType);
        } else {
          // Try to extract JSON using our more sophisticated extraction method
          console.log("Response doesn't look like direct JSON, attempting extraction");
          const extracted = this.extractJsonFromResponse(outputText);
          if (extracted) {
            console.log("Successfully extracted JSON from response");
            return this.validateType(extracted, returnType);
          }
          // If no JSON found, return the raw text
          console.log("No JSON found in response, returning raw text");
          return outputText;
        }
      } catch (e) {
        // If parsing fails, try using our intelligent JSON extractor
        console.log("Could not parse response as JSON directly, attempting to extract JSON");
        const extracted = this.extractJsonFromResponse(outputText);
        if (extracted) {
          return this.validateType(extracted, returnType);
        }
        
        // If extraction also fails, fall back to returning the raw text
        console.warn("JSON extraction failed, returning raw text");
      }
      
      // Return the raw text if not JSON or JSON parsing failed
      return outputText;
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      throw new Error(`Failed to call prompt ${promptName}: ${error.message}`);
    }
  },
  
  // Process and validate the response from the prompt
  processResponse(response, returnType) {
    try {
      // If response is already parsed, validate it
      if (typeof response === 'object') {
        return this.validateType(response, returnType);
      }
      
      // Try to parse response as JSON if it's a string
      if (typeof response === 'string') {
        try {
          const parsedResponse = JSON.parse(response);
          return this.validateType(parsedResponse, returnType);
        } catch (e) {
          // Try using our intelligent JSON extractor
          const extracted = this.extractJsonFromResponse(response);
          if (extracted) {
            return this.validateType(extracted, returnType);
          }
          
          // Return as is if not valid JSON and couldn't extract
          return response;
        }
      }
      
      return response;
    } catch (error) {
      console.error("Error processing prompt response:", error);
      throw new Error(`Failed to process prompt response: ${error.message}`);
    }
  },
  
  // Validate the data against the specified type
  validateType(data, type) {
    if (!type) return data; // No type checking if no type is provided
    
    // Type validation logic
    if (type.type === "TypeObject") {
      if (typeof data !== "object" || data === null) {
        throw new TypeError(`Expected object, got ${typeof data}`);
      }
      
      // Check each property in the type object
      for (const prop of type.properties) {
        const propName = prop.key.name;
        if (!(propName in data)) {
          throw new TypeError(`Missing required property: ${propName}`);
        }
        
        // Recursively validate nested properties
        data[propName] = this.validateType(data[propName], prop.value);
      }
    } else if (type.name?.name === "list" && type.genericType) {
      if (!Array.isArray(data)) {
        throw new TypeError(`Expected array, got ${typeof data}`);
      }
      
      // Validate each item in the array
      data = data.map(item => this.validateType(item, type.genericType));
    }
    
    return data;
  }
};

// Registry for all imported prompts
const _promptRegistry = {};

// Built-in functions
const _builtins = {
  // Simple print function (maps to console.log)
  print: function(...args) {
    console.log(...args);
    return args[args.length - 1]; // Return the last argument for chaining
  },
  
  // Add more built-in functions here
  stringify: function(obj) {
    return JSON.stringify(obj, null, 2);
  },
  
  parse: function(str) {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }
}; 