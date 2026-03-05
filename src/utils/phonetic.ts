/**
 * Utility functions to extract phonetic symbols from various dictionaries
 */

import { search as youdaoSearch } from "../dictionary/youdao/engine";
import { search as cambridgeSearch } from "../dictionary/cambridge/engine";

/**
 * Extract phonetic symbol from Collins dictionary (via Youdao)
 * Collins content is HTML, so we need to extract IPA phonetic from it
 */
export async function getCollinsPhonetic(word: string): Promise<string | null> {
    try {
        const result = await youdaoSearch(word);
        
        if (!result || !result.result) {
            return null;
        }

        const lexResult = result.result;
        
        // Collins 数据在 collins 字段中，每个 collins 项包含 title 和 content (HTML)
        if (lexResult.collins && lexResult.collins.length > 0) {
            // 遍历所有 collins 条目，寻找音标
            for (const collinsItem of lexResult.collins) {
                const collinsContent = collinsItem.content || "";
                
                // 从 Collins 内容中提取音标 /.../ 格式（IPA 音标）
                // IPA 字符集合（常见的 IPA 音素）
                const ipaChars = /[ɪɛæɑɒʌʊəˈˌːŋθðʃʒɡjwɥ]/;
                const phoneticMatch = collinsContent.match(/\/([^\/\n]+)\//);
                
                if (phoneticMatch && phoneticMatch[1] && ipaChars.test(phoneticMatch[1])) {
                    return phoneticMatch[1].trim();
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching Collins phonetic:", error);
        return null;
    }
}

/**
 * Extract phonetic symbol from Cambridge dictionary
 * Cambridge returns HTML with dpron-i class containing phonetic symbols
 */
export async function getCambridgePhonetic(word: string): Promise<string | null> {
    try {
        const result = await cambridgeSearch(word);
        
        if (!result || !result.result) {
            return null;
        }

        const entries = result.result;
        
        // Iterate through entries to find phonetic symbols
        for (const entry of entries) {
            const html = entry.html || "";
            
            // Cambridge stores pronunciation in dpron-i elements with IPA symbols
            // Pattern: look for /.../ with IPA characters
            const phoneticMatch = html.match(/\/([^\/\n]+)\//);
            
            if (phoneticMatch && phoneticMatch[1]) {
                const phonetic = phoneticMatch[1].trim();
                
                // Verify it contains IPA characters
                const ipaChars = /[ɪɛæɑɒʌʊəˈˌːŋθðʃʒɡjwɥ]/;
                if (ipaChars.test(phonetic)) {
                    return phonetic;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error("Error fetching Cambridge phonetic:", error);
        return null;
    }
}

/**
 * Get phonetic symbol with priority: Collins > Cambridge > null
 */
export async function getPhoneticSymbol(word: string): Promise<string | null> {
    // Try Collins first
    const collinsPhonetic = await getCollinsPhonetic(word);
    if (collinsPhonetic) {
        console.log("Found Collins phonetic:", collinsPhonetic);
        return collinsPhonetic;
    }
    
    // Fall back to Cambridge
    const cambridgePhonetic = await getCambridgePhonetic(word);
    if (cambridgePhonetic) {
        console.log("Found Cambridge phonetic:", cambridgePhonetic);
        return cambridgePhonetic;
    }
    
    // No phonetic found
    return null;
}

