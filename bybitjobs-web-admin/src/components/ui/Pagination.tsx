import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  label = 'kết quả',
}) => {
  const { colors } = useTheme();

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array (e.g., [1, 2, 3, 4, 5])
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <View style={[styles.container, { borderTopColor: colors.borderLight }]}>
      <Typography variant="body2" color="secondary">
        Hiển thị <Typography variant="body2" style={{ fontWeight: '700' }}>{startItem}-{endItem}</Typography> trên <Typography variant="body2" style={{ fontWeight: '700' }}>{totalItems}</Typography> {label}
      </Typography>

      <View style={styles.buttonsRow}>
        {/* Previous Page Button */}
        <TouchableOpacity
          style={[
            styles.btn,
            { borderColor: colors.borderColor, backgroundColor: colors.bgSecondary },
            currentPage === 1 && { opacity: 0.4 },
          ]}
          onPress={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Page Number Buttons */}
        {pageNumbers.map((page) => {
          const isActive = page === currentPage;
          return (
            <TouchableOpacity
              key={page}
              style={[
                styles.btn,
                {
                  borderColor: isActive ? colors.primaryColor : colors.borderColor,
                  backgroundColor: isActive ? colors.primaryColor : colors.bgSecondary,
                },
              ]}
              onPress={() => onPageChange(page)}
            >
              <Typography
                variant="body2"
                style={{
                  color: isActive ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: isActive ? '700' : '500',
                }}
              >
                {page}
              </Typography>
            </TouchableOpacity>
          );
        })}

        {/* Next Page Button */}
        <TouchableOpacity
          style={[
            styles.btn,
            { borderColor: colors.borderColor, backgroundColor: colors.bgSecondary },
            (currentPage === totalPages || totalPages === 0) && { opacity: 0.4 },
          ]}
          onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btn: {
    height: 34,
    minWidth: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
