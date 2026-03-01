import React, { useState, useRef, useEffect, useMemo } from 'react';
import './RiskScanner.css';

const CRITICAL_RISKS = [
    "PayPal", "Payoneer", "Wise", "Skrill", "Binance", "Stripe", "direct payment",
    "send money", "transfer", "wire transfer", "invoice outside", "crypto",
    "USDT", "Bitcoin", "WhatsApp", "Telegram", "Skype", "Zoom", "Google Meet",
    "Facebook", "Messenger", "Instagram", "LinkedIn", "Discord", "Viber", "IMO",
    "Email", "Gmail", "Yahoo", "number", "phone", "call", "meeting",
    "Contact me outside", "text me", "bank account", "account number",
    "routing number", "IBAN", "card number", "NID", "passport", "address",
    "phone number", "personal email", "@", "payment", "bank transfer",
    "payments", "pay", "pay outside", "contact me", "contact me directly",
    "marketplace", "bill", "account", "money", "meetings", "TikTok", "% fee"
].sort((a, b) => b.length - a.length);

const WARNING_WORDS = [
    "discuss elsewhere", "off platform", "work outside Fiverr",
    "cheaper outside", "avoid commission", "direct deal", "long term outside"
].sort((a, b) => b.length - a.length);

const RiskScanner = () => {
    const editorRef = useRef(null);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [riskCount, setRiskCount] = useState(0);
    const [warningCount, setWarningCount] = useState(0);

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
        const textValue = el.innerText || "";
        const offset = getCaretCharacterOffsetWithin(el);

        // 1. Create Risk Regex
        const riskPattern = CRITICAL_RISKS.map(word => {
            if (word === "% fee") return `\\d*%\\s*fee`;
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return /^[a-zA-Z0-9]/.test(word) ? `\\b${escaped}` : escaped;
        }).join('|');
        const riskRegex = new RegExp(`(${riskPattern})`, 'gi');

        // 2. Create Warning Regex
        const warningPattern = WARNING_WORDS.map(word => {
            const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return /^[a-zA-Z0-9]/.test(word) ? `\\b${escaped}` : escaped;
        }).join('|');
        const warningRegex = new RegExp(`(${warningPattern})`, 'gi');

        // 3. Count matches
        const risks = textValue.match(riskRegex) || [];
        const warnings = textValue.match(warningRegex) || [];

        // 4. Highlight (Single Pass logic using markers to avoid nested interference)
        let processed = escapeHtml(textValue);

        // Mark Risks first
        processed = processed.replace(riskRegex, '##RISK_OPEN##$1##RISK_CLOSE##');
        // Mark Warnings (only if not already inside a Risk tag)
        processed = processed.replace(warningRegex, (match) => {
            return `##WARN_OPEN##${match}##WARN_CLOSE##`;
        });

        const finalHtml = processed
            .split('##RISK_OPEN##').join('<span class="highlight">')
            .split('##RISK_CLOSE##').join('</span>')
            .split('##WARN_OPEN##').join('<span class="warning-highlight">')
            .split('##WARN_CLOSE##').join('</span>');

        if (el.innerHTML !== finalHtml) {
            el.innerHTML = finalHtml;
            setCaretPosition(el, offset);
        }

        setRiskCount(risks.length);
        setWarningCount(warnings.length);
        setCharCount(textValue.length);
        setWordCount(textValue.trim() ? textValue.trim().split(/\s+/).length : 0);
    };

    const handleClear = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
            setRiskCount(0);
            setWarningCount(0);
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
                    Edit your message. Risks are in <span style={{ color: 'var(--danger)' }}>red</span> and warnings in <span style={{ color: '#b45309' }}>yellow</span>.
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
                    <div className={`risk-badge ${riskCount > 0 ? 'active' : ''}`}>
                        {riskCount} Potential {riskCount === 1 ? 'Risk' : 'Risks'}
                    </div>
                    <div className={`warning-badge ${warningCount > 0 ? 'active' : ''}`}>
                        {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
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
