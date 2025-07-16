import { useState, useCallback } from 'react';
import { DocumentFile, Difference, ComparisonStats } from '../types';
import { DocumentParser } from '../utils/documentParser';
import { DiffEngine } from '../utils/diffEngine';

export const useDocumentComparison = () => {
  const [leftDocument, setLeftDocument] = useState<DocumentFile | null>(null);
  const [rightDocument, setRightDocument] = useState<DocumentFile | null>(null);
  const [differences, setDifferences] = useState<Difference[]>([]);
  const [stats, setStats] = useState<ComparisonStats>({
    totalDifferences: 0,
    additions: 0,
    deletions: 0,
    modifications: 0,
    textChanges: 0,
    formatChanges: 0,
    structureChanges: 0,
  });
  const [isLoading, setIsLoading] = useState<{
    left: boolean;
    right: boolean;
  }>({
    left: false,
    right: false,
  });
  const [errors, setErrors] = useState<{
    left: string | null;
    right: string | null;
  }>({
    left: null,
    right: null,
  });

  const processFile = useCallback(async (file: File, side: 'left' | 'right') => {
    setIsLoading(prev => ({ ...prev, [side]: true }));
    setErrors(prev => ({ ...prev, [side]: null }));
    
    try {
      const document = await DocumentParser.parseFile(file);
      
      if (side === 'left') {
        setLeftDocument(document);
      } else {
        setRightDocument(document);
      }
      
      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error processing ${side} document:`, error);
      setErrors(prev => ({ ...prev, [side]: errorMessage }));
      throw error;
    } finally {
      setIsLoading(prev => ({ ...prev, [side]: false }));
    }
  }, []);

  const compareDocuments = useCallback(() => {
    if (!leftDocument || !rightDocument) {
      setDifferences([]);
      setStats({
        totalDifferences: 0,
        additions: 0,
        deletions: 0,
        modifications: 0,
        textChanges: 0,
        formatChanges: 0,
        structureChanges: 0,
      });
      return;
    }

    try {
      const diffs = DiffEngine.generateDifferences(
        leftDocument.content,
        rightDocument.content
      );
      
      const comparisonStats = DiffEngine.calculateStats(diffs);
      
      setDifferences(diffs);
      setStats(comparisonStats);
    } catch (error) {
      console.error('Error comparing documents:', error);
      setDifferences([]);
      setStats({
        totalDifferences: 0,
        additions: 0,
        deletions: 0,
        modifications: 0,
        textChanges: 0,
        formatChanges: 0,
        structureChanges: 0,
      });
    }
  }, [leftDocument, rightDocument]);

  const clearComparison = useCallback(() => {
    setLeftDocument(null);
    setRightDocument(null);
    setDifferences([]);
    setStats({
      totalDifferences: 0,
      additions: 0,
      deletions: 0,
      modifications: 0,
      textChanges: 0,
      formatChanges: 0,
      structureChanges: 0,
    });
    setErrors({ left: null, right: null });
  }, []);

  return {
    leftDocument,
    rightDocument,
    differences,
    stats,
    isLoading,
    errors,
    processFile,
    compareDocuments,
    clearComparison,
  };
};