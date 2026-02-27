import React, { useState, useRef, useEffect, useMemo } from 'react';
import './RiskScanner.css';

const RISKY_KEYWORDS = [
    "call", "phone number", "WhatsApp", "number", "Telegram", "email",
    "payment", "@", "PayPal", "Payoneer", "bank transfer",
    "direct payment", "payments", "gmail", "pay", "pay outside", "contact me directly", "Skype"
].sort((a, b) => b.length - a.length);

const RiskScanner = () => {
    const editorRef = useRef(null);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [riskCount, setRiskCount] = useState(0);

    // Function to get caret position in characters
    const getCaretCharacterOffsetWithin = (element) => {
        let caretOffset = 0;
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
        return caretOffset;
    };

    // Function to set caret position from character offset
    const setCaretPosition = (element, offset) => {
        const range = document.createRange();
        const selection = window.getSelection();
        let currentOffset = 0;
        let found = false;

        const traverse = (node) => {
            if (found) return;
            if (node.nodeType === 3) { // Text node
                const nextOffset = currentOffset + node.length;
                if (offset <= nextOffset) {
                    range.setStart(node, offset - currentOffset);
                    range.setEnd(node, offset - currentOffset);
                    found = true;
                }
                currentOffset = nextOffset;
            } else {
                for (let i = 0; i < node.childNodes.length; i++) {
                    traverse(node.childNodes[i]);
                }
            }
        };

        traverse(element);
        if (!found) {
            range.setStart(element, element.childNodes.length);
            range.setEnd(element, element.childNodes.length);
        }
        selection.removeAllRanges();
        selection.addRange(range);
    };

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const handleInput = () => {
        const el = editorRef.current;
        const selection = window.getSelection();

        // Save caret position
        const offset = getCaretCharacterOffsetWithin(el);
        const textValue = el.innerText || "";

        // Process Highlights
        let highlighted = escapeHtml(textValue);
        let foundCount = 0;

        RISKY_KEYWORDS.forEach(word => {
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Remove trailing \b to allow matching plurals (e.g., "gmails" matches "gmail")
            const regexSource = /^[a-zA-Z0-9]/.test(word) ? `\\b${escapedWord}` : escapedWord;
            const regex = new RegExp(regexSource, 'gi');

            const matches = textValue.match(regex);
            if (matches) foundCount += matches.length;

            highlighted = highlighted.replace(regex, '##OPEN##$&##CLOSE##');
        });

        const finalHtml = highlighted
            .split('##OPEN##').join('<span class="highlight">')
            .split('##CLOSE##').join('</span>');

        // Update content if different (to avoid unnecessary re-renders)
        if (el.innerHTML !== finalHtml) {
            el.innerHTML = finalHtml;
            // Restore caret
            setCaretPosition(el, offset);
        }

        // Update stats
        setRiskCount(foundCount);
        setCharCount(textValue.length);
        setWordCount(textValue.trim() ? textValue.trim().split(/\s+/).length : 0);
    };

    const handleClear = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
            setRiskCount(0);
            setCharCount(0);
            setWordCount(0);
            editorRef.current.focus();
        }
    };

    // Initial focus and setup
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
    }, []);

    return (
        <div className="risk-scanner-container">
            <header className="header">
                <h1>Fiverr Message Scanner</h1>
                <p className="subtitle">
                    Edit your message. Risks are marked in <span style={{ color: 'var(--danger)' }}>red</span> as you type.
                </p>
            </header>

            <div className="editor-wrapper">
                <div
                    ref={editorRef}
                    className="editable-area"
                    contentEditable="true"
                    spellCheck="false"
                    onInput={handleInput}
                    placeholder="Paste or type your message here..."
                />
            </div>

            <div className="controls">
                <div className="stats-group">
                    <div className={`risk-badge ${riskCount > 0 ? 'warning' : ''}`}>
                        {riskCount} Potential {riskCount === 1 ? 'Risk' : 'Risks'} Found
                    </div>
                    <div className={`word-badge ${wordCount > 2500 ? 'warning' : ''}`}>
                        {wordCount.toLocaleString()} Words
                    </div>
                    <div className="word-badge">
                        {charCount.toLocaleString()} Characters
                    </div>
                </div>
                <button className="btn-clear" onClick={handleClear}>Clear All</button>
            </div>

            {wordCount > 2500 && (
                <div className="limit-message">
                    ⚠️ Your message is more than 2,500 words
                </div>
            )}
        </div>
    );
};

export default RiskScanner;
