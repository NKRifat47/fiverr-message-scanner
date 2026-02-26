import React, { useState, useMemo, useRef, useEffect } from 'react';
import './RiskScanner.css';

const RISKY_KEYWORDS = [
    "call", "phone number", "WhatsApp", "Telegram", "email",
    "payment", "@", "PayPal", "Payoneer", "bank transfer",
    "direct payment", "gmail", "pay outside", "contact me directly", "Skype"
].sort((a, b) => b.length - a.length);

const RiskScanner = () => {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);
    const backdropRef = useRef(null);

    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const { processedHtml, riskCount, wordCount } = useMemo(() => {
        let highlighted = escapeHtml(text);
        let foundCount = 0;

        RISKY_KEYWORDS.forEach(word => {
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regexSource = /^[a-zA-Z0-9]/.test(word) ? `\\b${escapedWord}\\b` : escapedWord;
            const regex = new RegExp(regexSource, 'gi');

            const matches = text.match(regex);
            if (matches) foundCount += matches.length;

            highlighted = highlighted.replace(regex, '##OPEN##$&##CLOSE##');
        });

        const html = highlighted
            .split('##OPEN##').join('<span class="highlight">')
            .split('##CLOSE##').join('</span>')
            + (text.endsWith('\n') ? '\n' : '');

        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        return { processedHtml: html, riskCount: foundCount, wordCount: words };
    }, [text]);

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleClear = () => {
        setText('');
        if (textareaRef.current) textareaRef.current.focus();
    };

    return (
        <div className="risk-scanner-container">
            <header className="header">
                <h1>Fiverr Message Scanner</h1>
                <p className="subtitle">
                    Edit your message. Risks are marked in <span style={{ color: 'var(--danger)' }}>red</span> as you type.
                </p>
            </header>

            <div className="editor-container">
                <div
                    ref={backdropRef}
                    className="backdrop"
                    dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
                <textarea
                    ref={textareaRef}
                    className="textarea"
                    spellcheck="false"
                    placeholder="Paste or type your message here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onScroll={handleScroll}
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
